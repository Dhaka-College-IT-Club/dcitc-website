import "./setup.js";
import assert from "node:assert/strict";
import { after, before, describe, it } from "node:test";
import { eq, sql } from "drizzle-orm";
import { env } from "../src/config/env.js";
import { db } from "../src/db/pool.js";
import { otpCodes, users } from "../src/db/schema.js";
import { testOutbox } from "../src/mail/index.js";
import { issueOtp, verifyOtp } from "../src/services/otp.js";
import { setGoogleClient } from "../src/services/google.js";
import { ageRecentOtp, closePool, hasTestDb, prepareDatabase } from "./db.js";
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

  dbIt("reports an existing account as email_taken and sends no mail", async () => {
    await signup("existing@example.com");
    testOutbox.length = 0;
    const response = await client.req("/api/v2/auth/signup/request-otp", {
      body: { email: "existing@example.com" },
    });
    assert.equal(response.status, 409);
    assert.deepEqual(response.body, {
      error: { code: "email_taken", message: "That email is already registered." },
    });
    assert.equal(testOutbox.length, 0);
    assert.equal(response.setCookies.length, 0);
  });

  dbIt("answers a request inside the 60 second cooldown with 429 and Retry-After", async () => {
    const email = "cooldown@example.com";
    const first = await requestSignupOtp(email);
    assert.equal(first.status, 200);

    const second = await client.req("/api/v2/auth/signup/request-otp", { body: { email } });
    assert.equal(second.status, 429);
    assert.equal(second.body.error.code, "rate_limited");
    assert.ok(Number(second.headers.get("retry-after")) > 0);
    assert.equal(second.setCookies.length, 0);
    assert.equal(testOutbox.length, 1, "the cooldown must block a second send");
  });

  dbIt("reports a provider failure as 502 and starts no cooldown", async () => {
    const email = "delivery-failure@example.com";
    const originalTransport = env.MAIL_TRANSPORT;
    const originalFetch = globalThis.fetch;
    env.MAIL_TRANSPORT = "resend";
    env.RESEND_API_KEY = "re_test_key";
    env.EMAIL_FROM = "no-reply@example.com";
    globalThis.fetch = (async (input: string | URL | Request, init?: RequestInit) => {
      if (String(input).startsWith("https://api.resend.com")) throw new TypeError("offline");
      return originalFetch(input, init);
    }) as typeof fetch;

    try {
      testOutbox.length = 0;
      const failed = await client.req("/api/v2/auth/signup/request-otp", { body: { email } });
      assert.equal(failed.status, 502);
      assert.equal(failed.body.error.code, "delivery_failed");
      assert.equal(failed.setCookies.length, 0);
      assert.equal(testOutbox.length, 0);
    } finally {
      globalThis.fetch = originalFetch;
      env.MAIL_TRANSPORT = originalTransport;
    }

    const retried = await client.req("/api/v2/auth/signup/request-otp", { body: { email } });
    assert.equal(retried.status, 200, "the failed send must not start a cooldown");
    assert.equal(testOutbox.length, 1);
  });

  dbIt("creates an account with an empty batch when the field is omitted", async () => {
    testOutbox.length = 0;
    const email = "no-batch@example.com";
    const first = await requestSignupOtp(email);
    const verified = await client.req("/api/v2/auth/signup/verify-otp", { body: { email, code: first.code } });
    const completed = await client.req("/api/v2/auth/signup/complete", {
      body: { signupToken: verified.body.data.signupToken, name: "No Batch", password: "Password123!" },
    });
    assert.equal(completed.status, 201);
    assert.equal(completed.body.data.hscBatch, "");
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

describe("otp issuance", () => {
  dbIt("keeps the previous code and starts no cooldown when delivery throws", async () => {
    const email = "otp-send-failure@example.com";
    const issued: string[] = [];
    await issueOtp(email, "signup", async (code) => {
      issued.push(code);
    });
    await ageRecentOtp(email);

    await assert.rejects(
      issueOtp(email, "signup", async () => {
        throw new Error("provider down");
      }),
      /provider down/,
    );

    const rows = await db.select().from(otpCodes).where(eq(otpCodes.email, email));
    assert.equal(rows.length, 1, "the failed row must be removed");
    assert.equal(rows[0]!.consumedAt, null);
    assert.ok(rows[0]!.createdAt.getTime() < Date.now() - 60_000, "the failed row must not start a cooldown");

    await verifyOtp(email, "signup", issued[0]!);
    await issueOtp(email, "signup", async (code) => {
      issued.push(code);
    });
    assert.equal(issued.length, 2, "a fresh code can be issued immediately after a failure");
  });

  dbIt("consumes the previous code only after a successful send", async () => {
    const email = "otp-success@example.com";
    const issued: string[] = [];
    await issueOtp(email, "signup", async (code) => {
      issued.push(code);
    });
    await ageRecentOtp(email);
    await issueOtp(email, "signup", async (code) => {
      issued.push(code);
    });

    await assert.rejects(
      verifyOtp(email, "signup", issued[0]!),
      (error: unknown) => (error as { code?: string }).code === "invalid_otp",
    );
    await verifyOtp(email, "signup", issued[1]!);
  });

  dbIt("still enforces the cooldown after a successful send", async () => {
    const email = "otp-cooldown@example.com";
    await issueOtp(email, "signup", async () => {});
    await assert.rejects(
      issueOtp(email, "signup", async () => {}),
      (error: unknown) => (error as { status?: number }).status === 429,
    );
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

  dbIt("reports an unknown address as email_not_found with no mail", async () => {
    testOutbox.length = 0;
    const response = await client.req("/api/v2/auth/password/forgot", { body: { email: "nobody@example.com" } });
    assert.equal(response.status, 409);
    assert.deepEqual(response.body, {
      error: { code: "email_not_found", message: "That email is not registered." },
    });
    assert.equal(response.setCookies.length, 0);
    assert.equal(testOutbox.length, 0);
  });

  dbIt("answers a reset request inside the cooldown with 429 and Retry-After", async () => {
    const email = "reset-cooldown@example.com";
    await signup(email, "Reset Cooldown");

    testOutbox.length = 0;
    const first = await client.req("/api/v2/auth/password/forgot", { body: { email } });
    assert.equal(first.status, 200);

    const second = await client.req("/api/v2/auth/password/forgot", { body: { email } });
    assert.equal(second.status, 429);
    assert.equal(second.body.error.code, "rate_limited");
    assert.ok(Number(second.headers.get("retry-after")) > 0);
    assert.equal(second.setCookies.length, 0);
    assert.equal(testOutbox.length, 1, "the cooldown must block a second send");
  });

  dbIt("reports a provider failure as 502 and starts no cooldown", async () => {
    const email = "reset-failure@example.com";
    await signup(email, "Reset Failure");

    const originalTransport = env.MAIL_TRANSPORT;
    const originalFetch = globalThis.fetch;
    env.MAIL_TRANSPORT = "resend";
    env.RESEND_API_KEY = "re_test_key";
    env.EMAIL_FROM = "no-reply@example.com";
    globalThis.fetch = (async (input: string | URL | Request, init?: RequestInit) => {
      if (String(input).startsWith("https://api.resend.com")) return new Response("nope", { status: 500 });
      return originalFetch(input, init);
    }) as typeof fetch;

    try {
      testOutbox.length = 0;
      const failed = await client.req("/api/v2/auth/password/forgot", { body: { email } });
      assert.equal(failed.status, 502);
      assert.equal(failed.body.error.code, "delivery_failed");
      assert.equal(failed.setCookies.length, 0);
      assert.equal(testOutbox.length, 0);
    } finally {
      globalThis.fetch = originalFetch;
      env.MAIL_TRANSPORT = originalTransport;
    }

    const retried = await client.req("/api/v2/auth/password/forgot", { body: { email } });
    assert.equal(retried.status, 200, "the failed send must not start a cooldown");
    assert.equal(testOutbox.length, 1);
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
