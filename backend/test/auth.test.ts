import "./setup.js";
import assert from "node:assert/strict";
import { after, before, describe, it } from "node:test";
import { eq, sql } from "drizzle-orm";
import { db } from "../src/db/pool.js";
import { users } from "../src/db/schema.js";
import { testOutbox } from "../src/mail/index.js";
import { GoogleExchangeError, setGoogleClient } from "../src/services/google.js";
import { closePool, hasTestDb, prepareDatabase } from "./db.js";
import { Client, startServer } from "./helpers.js";

let client: Client;
let baseUrl: string;
let close: () => Promise<void>;
const dbIt = hasTestDb ? it : it.skip;

const codeFromLastMail = (): string => {
  const mail = testOutbox.at(-1);
  assert.ok(mail, "expected a mail in the test outbox");
  const match = mail.text.match(/(\d{6})/);
  assert.ok(match, `no 6-digit code in: ${mail.text}`);
  return match[1]!;
};

async function requestSignupOtp(email: string): Promise<{ status: number; code?: string }> {
  testOutbox.length = 0;
  const response = await client.req("/api/v2/auth/signup/request-otp", { body: { email } });
  return { status: response.status, code: testOutbox.length ? codeFromLastMail() : undefined };
}

async function signup(email: string, name = "Test User", hscBatch = "DC-27"): Promise<string> {
  const first = await requestSignupOtp(email);
  const verified = await client.req("/api/v2/auth/signup/verify-otp", { body: { email, code: first.code } });
  const completed = await client.req("/api/v2/auth/signup/complete", {
    body: { signupToken: verified.body.data.signupToken, name, hscBatch, password: "Password123!" },
  });
  assert.equal(completed.status, 201);
  return completed.body.data.id;
}

before(async () => {
  if (!hasTestDb) return;
  await prepareDatabase();
  const started = await startServer();
  client = started.client;
  baseUrl = started.baseUrl;
  close = started.close;
});

after(async () => {
  if (!hasTestDb) return;
  setGoogleClient({
    exchangeCode: async () => {
      throw new Error("not configured");
    },
    verifyIdToken: async () => null,
  });
  await close();
  await closePool();
});

describe("signup", () => {
  dbIt("completes the three steps and sets a user cookie", async () => {
    testOutbox.length = 0;
    const email = "signup@example.com";
    const first = await requestSignupOtp(email);
    assert.equal(first.status, 200);
    assert.equal(first.code?.length, 6);

    const wrong = await client.req("/api/v2/auth/signup/verify-otp", { body: { email, code: "000000" } });
    assert.equal(wrong.status, 400);
    assert.equal(wrong.body.error.code, "invalid_otp");

    const verified = await client.req("/api/v2/auth/signup/verify-otp", { body: { email, code: first.code } });
    assert.equal(verified.status, 200);
    assert.equal(typeof verified.body.data.signupToken, "string");

    const completed = await client.req("/api/v2/auth/signup/complete", {
      body: {
        signupToken: verified.body.data.signupToken,
        name: "Signup User",
        hscBatch: "DC-26",
        password: "Password123!",
      },
    });
    assert.equal(completed.status, 201);
    assert.match(completed.body.data.id, /^[0-9a-f-]{36}$/);
    assert.equal(completed.body.data.hscBatch, "DC-26");

    const cookie = completed.setCookies.find((value) => value.startsWith("dcitc_at="));
    assert.ok(cookie);
    assert.match(cookie!, /HttpOnly/i);
    assert.match(cookie!, /SameSite=Lax/i);
    assert.match(cookie!, /Path=\//i);

    const me = await client.req("/api/v2/auth/me");
    assert.equal(me.status, 200);
    assert.equal(me.body.data.email, email);
    assert.equal(me.body.data.passwordHash, undefined);
  });

  dbIt("returns a generic response and sends no mail for an existing account", async () => {
    await signup("existing@example.com");
    testOutbox.length = 0;
    const response = await client.req("/api/v2/auth/signup/request-otp", {
      body: { email: "existing@example.com" },
    });
    assert.equal(response.status, 200);
    assert.deepEqual(response.body, { data: { sent: true } });
    assert.equal(testOutbox.length, 0);
  });

  dbIt("enforces the 60 second resend cooldown without revealing the account state", async () => {
    const email = "cooldown@example.com";
    const first = await requestSignupOtp(email);
    assert.equal(first.status, 200);
    const second = await client.req("/api/v2/auth/signup/request-otp", { body: { email } });
    assert.equal(second.status, 200);
    assert.deepEqual(second.body, { data: { sent: true } });
    assert.equal(testOutbox.length, 1, "the cooldown must still block a second send");
  });

  dbIt("answers identically during cooldown for known and unknown addresses", async () => {
    const known = "cooldown-known@example.com";
    const unknown = "cooldown-unknown@example.com";
    await signup(known);

    testOutbox.length = 0;
    const knownFirst = await client.req("/api/v2/auth/signup/request-otp", { body: { email: known } });
    const knownSecond = await client.req("/api/v2/auth/signup/request-otp", { body: { email: known } });
    assert.equal(knownFirst.status, 200);
    assert.equal(knownSecond.status, 200);
    assert.equal(testOutbox.length, 0);

    const unknownFirst = await client.req("/api/v2/auth/signup/request-otp", { body: { email: unknown } });
    const unknownSecond = await client.req("/api/v2/auth/signup/request-otp", { body: { email: unknown } });
    assert.equal(unknownFirst.status, 200);
    assert.equal(unknownSecond.status, 200);
    assert.equal(testOutbox.length, 1, "the cooldown blocks the second mail");
    assert.deepEqual(knownSecond.body, unknownSecond.body);
  });

  dbIt("rejects an expired code", async () => {
    const email = "expired@example.com";
    const first = await requestSignupOtp(email);
    await db.execute(sql`update otp_codes set expires_at = now() - interval '1 minute'`);
    const verified = await client.req("/api/v2/auth/signup/verify-otp", { body: { email, code: first.code } });
    assert.equal(verified.status, 400);
    assert.equal(verified.body.error.code, "otp_expired");
  });

  dbIt("locks the code after five wrong attempts", async () => {
    const email = "attempts@example.com";
    const first = await requestSignupOtp(email);
    for (let attempt = 1; attempt <= 4; attempt++) {
      const response = await client.req("/api/v2/auth/signup/verify-otp", {
        body: { email, code: "999999" },
      });
      assert.equal(response.body.error.code, "invalid_otp");
    }
    const fifth = await client.req("/api/v2/auth/signup/verify-otp", { body: { email, code: "999999" } });
    assert.equal(fifth.status, 400);
    assert.equal(fifth.body.error.code, "otp_exhausted");

    const correct = await client.req("/api/v2/auth/signup/verify-otp", { body: { email, code: first.code } });
    assert.equal(correct.body.error.code, "otp_exhausted");
  });

  dbIt("refuses a weak password", async () => {
    const email = "weak@example.com";
    const first = await requestSignupOtp(email);
    const verified = await client.req("/api/v2/auth/signup/verify-otp", { body: { email, code: first.code } });
    const completed = await client.req("/api/v2/auth/signup/complete", {
      body: { signupToken: verified.body.data.signupToken, name: "Weak", hscBatch: "", password: "short" },
    });
    assert.equal(completed.status, 400);
    assert.ok(completed.body.error.fields.password);
  });
});

describe("login and session", () => {
  dbIt("logs in, rejects bad credentials and logs out", async () => {
    const email = "login@example.com";
    await signup(email, "Login User");
    await client.req("/api/v2/auth/logout");

    const wrong = await client.req("/api/v2/auth/login", { body: { email, password: "nope" } });
    assert.equal(wrong.status, 401);
    assert.equal(wrong.body.error.code, "invalid_credentials");
    assert.equal(wrong.setCookies.length, 0);

    const unknown = await client.req("/api/v2/auth/login", {
      body: { email: "ghost@example.com", password: "Password123!" },
    });
    assert.equal(unknown.status, 401);
    assert.equal(unknown.body.error.code, "invalid_credentials");

    const ok = await client.req("/api/v2/auth/login", { body: { email, password: "Password123!" } });
    assert.equal(ok.status, 200);
    assert.ok(ok.setCookies.some((c) => c.startsWith("dcitc_at=")));

    const logout = await client.req("/api/v2/auth/logout", { method: "POST" });
    assert.equal(logout.status, 204);
    const me = await client.req("/api/v2/auth/me");
    assert.equal(me.status, 401);
  });

  dbIt("does not accept an admin cookie for /auth/me", async () => {
    await client.req("/api/v2/auth/logout");
    const admin = await client.req("/api/v2/admin/auth/login", {
      body: { email: process.env.SUPER_ADMIN_EMAIL!, password: process.env.SUPER_ADMIN_PASSWORD! },
    });
    assert.equal(admin.status, 200);
    const me = await client.req("/api/v2/auth/me");
    assert.equal(me.status, 401);
  });

  dbIt("does not accept a signup token as a session cookie", async () => {
    const email = "signup-token-confusion@example.com";
    const first = await requestSignupOtp(email);
    const verified = await client.req("/api/v2/auth/signup/verify-otp", {
      body: { email, code: first.code },
    });
    assert.equal(verified.status, 200);

    const forged = new Client(baseUrl);
    forged.cookie = `dcitc_at=${verified.body.data.signupToken}`;
    const me = await forged.req("/api/v2/auth/me");
    assert.equal(me.status, 401);
  });
});

describe("password reset", () => {
  dbIt("changes the password and revokes older sessions", async () => {
    const email = "reset@example.com";
    await signup(email, "Reset User");
    const oldCookie = client.cookie;
    assert.ok(oldCookie.includes("dcitc_at="));

    testOutbox.length = 0;
    const forgot = await client.req("/api/v2/auth/password/forgot", { body: { email } });
    assert.equal(forgot.status, 200);
    const code = codeFromLastMail();

    const reset = await client.req("/api/v2/auth/password/reset", {
      body: { email, code, password: "BrandNew123!" },
    });
    assert.equal(reset.status, 200);

    client.cookie = oldCookie;
    const stale = await client.req("/api/v2/auth/me");
    assert.equal(stale.status, 401);

    client.cookie = "";
    const login = await client.req("/api/v2/auth/login", { body: { email, password: "BrandNew123!" } });
    assert.equal(login.status, 200);
  });

  dbIt("returns the same generic response for an unknown email", async () => {
    testOutbox.length = 0;
    const response = await client.req("/api/v2/auth/password/forgot", { body: { email: "nobody@example.com" } });
    assert.equal(response.status, 200);
    assert.deepEqual(response.body, { data: { sent: true } });
    assert.equal(testOutbox.length, 0);
  });
});

describe("email recovery", () => {
  dbIt("mails a match and stays silent otherwise, with identical responses", async () => {
    testOutbox.length = 0;
    const matched = await client.req("/api/v2/auth/email/recover", {
      body: { name: "signup user", hscBatch: "dc-26" },
    });
    assert.equal(matched.status, 200);
    assert.equal(testOutbox.length, 1);
    assert.equal(testOutbox[0]!.to, "signup@example.com");

    testOutbox.length = 0;
    const missed = await client.req("/api/v2/auth/email/recover", {
      body: { name: "Nobody Here", hscBatch: "DC-99" },
    });
    assert.equal(missed.status, 200);
    assert.deepEqual(missed.body, matched.body);
    assert.equal(testOutbox.length, 0);
  });
});

describe("google oauth", () => {
  const start = async (target: Client) => {
    const response = await target.req("/api/v2/auth/google/start", { method: "GET" });
    assert.equal(response.status, 302);
    const location = new URL(response.headers.get("location")!);
    return { location, state: location.searchParams.get("state")! };
  };

  dbIt("redirects to Google with state, client id, scope and redirect uri", async () => {
    const { location } = await start(client);
    assert.equal(location.hostname, "accounts.google.com");
    assert.ok(location.searchParams.get("state"));
    assert.ok(location.searchParams.get("client_id"));
    assert.equal(location.searchParams.get("scope"), "openid email profile");
    assert.ok(location.searchParams.get("redirect_uri")?.endsWith("/api/v2/auth/google/callback"));
  });

  dbIt("rejects a callback without the state cookie", async () => {
    const fresh = new Client(baseUrl);
    const response = await fresh.req("/api/v2/auth/google/callback?code=abc&state=forged", { method: "GET" });
    assert.equal(response.status, 302);
    assert.match(response.headers.get("location")!, /\/login\?error=oauth_state$/);
    assert.equal(response.setCookies.some((cookie) => cookie.startsWith("dcitc_at=")), false);
  });

  dbIt("reports a denied consent instead of a state failure", async () => {
    const fresh = new Client(baseUrl);
    const original = console.error;
    const lines: string[] = [];
    console.error = (...args: unknown[]) => {
      lines.push(args.map(String).join(" "));
    };
    try {
      const response = await fresh.req(
        "/api/v2/auth/google/callback?error=access_denied&error_description=Denied&state=whatever",
        { method: "GET" },
      );
      assert.equal(response.status, 302);
      assert.match(response.headers.get("location")!, /\/login\?error=oauth_denied$/);
    } finally {
      console.error = original;
    }
    const entry = lines.map((line) => JSON.parse(line)).find((line) => line.message === "google_oauth_denied");
    assert.ok(entry);
    assert.equal(entry.error, "access_denied");
  });

  dbIt("logs the exchange step without the authorization code", async () => {
    const fresh = new Client(baseUrl);
    const { state } = await start(fresh);
    setGoogleClient({
      exchangeCode: async () => {
        throw new GoogleExchangeError("invalid_grant", "Bad Request");
      },
      verifyIdToken: async () => null,
    });

    const original = console.error;
    const lines: string[] = [];
    console.error = (...args: unknown[]) => {
      lines.push(args.map(String).join(" "));
    };
    let location = "";
    try {
      const callback = await fresh.req(
        `/api/v2/auth/google/callback?code=secret-auth-code&state=${state}`,
        { method: "GET" },
      );
      location = callback.headers.get("location")!;
    } finally {
      console.error = original;
    }

    assert.match(location, /\/login\?error=oauth_failed$/);
    const entry = lines.map((line) => JSON.parse(line)).find((line) => line.message === "google_oauth_failed");
    assert.ok(entry);
    assert.equal(entry.step, "exchange");
    assert.equal(entry.name, "GoogleExchangeError");
    assert.equal(entry.detail, "Bad Request");
    assert.ok(!lines.join("\n").includes("secret-auth-code"));
  });

  dbIt("logs the verify step without the id token", async () => {
    const fresh = new Client(baseUrl);
    const { state } = await start(fresh);
    setGoogleClient({
      exchangeCode: async () => "secret-id-token",
      verifyIdToken: async () => {
        throw new Error("bad signature");
      },
    });

    const original = console.error;
    const lines: string[] = [];
    console.error = (...args: unknown[]) => {
      lines.push(args.map(String).join(" "));
    };
    let location = "";
    try {
      const callback = await fresh.req(
        `/api/v2/auth/google/callback?code=abc&state=${state}`,
        { method: "GET" },
      );
      location = callback.headers.get("location")!;
    } finally {
      console.error = original;
    }

    assert.match(location, /\/login\?error=oauth_failed$/);
    const entry = lines.map((line) => JSON.parse(line)).find((line) => line.message === "google_oauth_failed");
    assert.ok(entry);
    assert.equal(entry.step, "verify");
    assert.equal(entry.name, "Error");
    assert.equal(entry.detail, "bad signature");
    assert.ok(!lines.join("\n").includes("secret-id-token"));
  });

  dbIt("creates a new user for a verified Google profile", async () => {
    setGoogleClient({
      exchangeCode: async () => "stub-id-token",
      verifyIdToken: async () => ({
        sub: "google-sub-new",
        email: "google-new@example.com",
        emailVerified: true,
        name: "Google New",
      }),
    });

    const { state } = await start(client);
    const callback = await client.req(`/api/v2/auth/google/callback?code=abc&state=${state}`, { method: "GET" });
    assert.equal(callback.status, 302);
    assert.match(callback.headers.get("location")!, /\/dashboard$/);
    assert.ok(callback.setCookies.some((c) => c.startsWith("dcitc_at=")));

    const [row] = await db.select().from(users).where(eq(users.googleSub, "google-sub-new"));
    assert.ok(row);
    assert.equal(row!.hscBatch, "");
  });

  dbIt("links an existing password account by verified email", async () => {
    setGoogleClient({
      exchangeCode: async () => "stub-id-token",
      verifyIdToken: async () => ({
        sub: "google-sub-link",
        email: "login@example.com",
        emailVerified: true,
        name: "Linked",
      }),
    });

    const { state } = await start(client);
    const callback = await client.req(`/api/v2/auth/google/callback?code=abc&state=${state}`, { method: "GET" });
    assert.equal(callback.status, 302);
    assert.match(callback.headers.get("location")!, /\/dashboard$/);

    const [row] = await db.select().from(users).where(eq(users.googleSub, "google-sub-link"));
    assert.equal(row?.email, "login@example.com");

    // Password login still works after linking.
    const login = await client.req("/api/v2/auth/login", {
      body: { email: "login@example.com", password: "Password123!" },
    });
    assert.equal(login.status, 200);
  });

  dbIt("rejects an unverified Google email", async () => {
    setGoogleClient({
      exchangeCode: async () => "stub-id-token",
      verifyIdToken: async () => ({
        sub: "google-sub-unverified",
        email: "unverified@example.com",
        emailVerified: false,
        name: "Unverified",
      }),
    });

    const fresh = new Client(baseUrl);
    const { state } = await start(fresh);
    const callback = await fresh.req(`/api/v2/auth/google/callback?code=abc&state=${state}`, { method: "GET" });
    assert.equal(callback.status, 302);
    assert.match(callback.headers.get("location")!, /\/login\?error=oauth_email$/);
    assert.equal(callback.setCookies.some((c) => c.startsWith("dcitc_at=")), false);
  });
});
