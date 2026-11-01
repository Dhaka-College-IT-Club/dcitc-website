import "./setup.js";
import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { fileURLToPath } from "node:url";
import { afterEach, describe, it } from "node:test";
import { hashPassword, verifyPassword } from "../src/lib/password.js";
import { signAdminToken, signUserToken, verifyAdminToken, verifyUserToken } from "../src/lib/jwt.js";
import { GoogleExchangeError, googleClient, verifyGoogleIdToken } from "../src/services/google.js";
import { sslConfig } from "../src/db/ssl.js";
import { MailDeliveryError, renderOtpEmail, sendSignupOtp, testOutbox } from "../src/mail/index.js";
import { env } from "../src/config/env.js";
import { SignJWT, createLocalJWKSet, exportJWK, generateKeyPair } from "jose";

const run = promisify(execFile);
const backendDir = fileURLToPath(new URL("..", import.meta.url));

describe("password hashing", () => {
  it("accepts the correct password", async () => {
    const hash = await hashPassword("correct horse battery staple");
    assert.match(hash, /^scrypt\$16384\$8\$1\$/);
    assert.equal(await verifyPassword("correct horse battery staple", hash), true);
  });

  it("rejects a wrong password", async () => {
    const hash = await hashPassword("right-password");
    assert.equal(await verifyPassword("wrong-password", hash), false);
  });

  it("rejects malformed encodings without throwing", async () => {
    for (const bad of ["", "plain", "scrypt$1$2$3", "scrypt$16384$8$1$notbase64$notbase64"]) {
      assert.equal(await verifyPassword("anything", bad), false);
    }
  });
});

describe("token separation", () => {
  const userId = "11111111-1111-4111-8111-111111111111";
  const adminId = "22222222-2222-4222-8222-222222222222";

  it("signs and verifies a user token", () => {
    const token = signUserToken(userId, 3);
    assert.deepEqual(verifyUserToken(token), { sub: userId, typ: "user", tv: 3 });
  });

  it("rejects a user token in the admin verifier", () => {
    assert.equal(verifyAdminToken(signUserToken(userId, 0)), null);
  });

  it("rejects an admin token in the user verifier", () => {
    assert.equal(verifyUserToken(signAdminToken(adminId, "super_admin", 0)), null);
  });
});

describe("google id token verification", () => {
  const keys = generateKeyPair("RS256");

  const makeToken = async (options: { audience?: string; expiresIn?: string; verified?: boolean } = {}) => {
    const { privateKey } = await keys;
    return new SignJWT({
      email: "google@example.com",
      email_verified: options.verified ?? true,
      name: "Google User",
    })
      .setProtectedHeader({ alg: "RS256", kid: "test-key" })
      .setSubject("google-sub-1")
      .setIssuer("https://accounts.google.com")
      .setAudience(options.audience ?? "test-client-id")
      .setIssuedAt()
      .setExpirationTime(options.expiresIn ?? "5m")
      .sign(privateKey);
  };

  const jwks = async () => {
    const { publicKey } = await keys;
    const jwk = await exportJWK(publicKey);
    return createLocalJWKSet({ keys: [{ ...jwk, kid: "test-key", alg: "RS256", use: "sig" }] });
  };

  it("accepts a valid token", async () => {
    const profile = await verifyGoogleIdToken(await makeToken(), await jwks(), "test-client-id");
    assert.equal(profile?.sub, "google-sub-1");
    assert.equal(profile?.emailVerified, true);
  });

  it("rejects an audience mismatch", async () => {
    const token = await makeToken({ audience: "someone-else" });
    assert.equal(await verifyGoogleIdToken(token, await jwks(), "test-client-id"), null);
  });

  it("rejects an expired token", async () => {
    const { privateKey } = await keys;
    const token = await new SignJWT({ email: "google@example.com", email_verified: true })
      .setProtectedHeader({ alg: "RS256", kid: "test-key" })
      .setSubject("google-sub-1")
      .setIssuer("https://accounts.google.com")
      .setAudience("test-client-id")
      .setExpirationTime(Math.floor(Date.now() / 1000) - 60)
      .sign(privateKey);
    assert.equal(await verifyGoogleIdToken(token, await jwks(), "test-client-id"), null);
  });

  it("reports an unverified email so the callback can refuse it", async () => {
    const profile = await verifyGoogleIdToken(await makeToken({ verified: false }), await jwks(), "test-client-id");
    assert.equal(profile?.emailVerified, false);
  });

  it("logs the verification failure without the token", async () => {
    const original = console.error;
    const lines: string[] = [];
    console.error = (...args: unknown[]) => {
      lines.push(args.map(String).join(" "));
    };
    try {
      assert.equal(await verifyGoogleIdToken("not-a-jwt", await jwks(), "test-client-id"), null);
    } finally {
      console.error = original;
    }

    const entry = lines.map((line) => JSON.parse(line)).find((line) => line.message === "google_id_token_verify_failed");
    assert.ok(entry, "expected a structured verification log line");
    assert.equal(entry.level, "warn");
    assert.ok(entry.name);
    assert.ok(entry.detail);
    assert.ok(!JSON.stringify(entry).includes("not-a-jwt"));
  });
});

describe("google token exchange", () => {
  const originalFetch = globalThis.fetch;

  const withFetch = async (impl: () => Promise<Response>, run: () => Promise<void>) => {
    globalThis.fetch = impl as typeof fetch;
    try {
      await run();
    } finally {
      globalThis.fetch = originalFetch;
    }
  };

  it("captures Google's error fields on a rejected exchange", async () => {
    await withFetch(
      async () =>
        new Response(JSON.stringify({ error: "invalid_grant", error_description: "Bad Request" }), {
          status: 400,
          headers: { "content-type": "application/json" },
        }),
      async () => {
        await assert.rejects(googleClient.exchangeCode("secret-auth-code"), (error: unknown) => {
          assert.ok(error instanceof GoogleExchangeError);
          assert.equal(error.code, "invalid_grant");
          assert.equal(error.description, "Bad Request");
          assert.ok(!error.message.includes("secret-auth-code"));
          return true;
        });
      },
    );
  });

  it("bounds the provider description and never includes the code", async () => {
    const long = "x".repeat(300);
    await withFetch(
      async () => new Response(JSON.stringify({ error: "invalid_request", error_description: long }), { status: 400 }),
      async () => {
        await assert.rejects(googleClient.exchangeCode("another-secret"), (error: unknown) => {
          assert.ok(error instanceof GoogleExchangeError);
          assert.equal(error.description.length, 200);
          assert.ok(!JSON.stringify(error).includes("another-secret"));
          return true;
        });
      },
    );
  });

  it("falls back when Google's error body is unreadable", async () => {
    await withFetch(
      async () => new Response("not json", { status: 502 }),
      async () => {
        await assert.rejects(googleClient.exchangeCode("secret"), (error: unknown) => {
          assert.ok(error instanceof GoogleExchangeError);
          assert.equal(error.code, "token_exchange_rejected");
          assert.equal(error.description, "");
          return true;
        });
      },
    );
  });

  it("returns the id token on success", async () => {
    await withFetch(
      async () => new Response(JSON.stringify({ id_token: "stub-id-token" }), { status: 200 }),
      async () => {
        assert.equal(await googleClient.exchangeCode("secret"), "stub-id-token");
      },
    );
  });
});

describe("otp email template", () => {
  for (const kind of ["signup", "password_reset"] as const) {
    it(`renders a complete, client-safe document for ${kind}`, () => {
      const mail = renderOtpEmail(kind, "123456");

      assert.match(mail.html, /^<!doctype html>/i);
      assert.equal((mail.html.match(/<html/gi) ?? []).length, 1, "exactly one html root");
      assert.equal((mail.html.match(/<body/gi) ?? []).length, 1, "exactly one body");
      assert.match(mail.html, /<meta name="color-scheme" content="light dark">/);
      assert.match(mail.html, /<meta name="supported-color-schemes" content="light dark">/);
      assert.ok(mail.html.includes("prefers-color-scheme"), "dark-mode path missing");
      assert.ok(mail.html.includes("[data-ogsc]"), "Outlook dark selector missing");
      assert.ok(mail.html.includes("[data-ogsb]"), "Outlook black selector missing");

      // Hosted raster logo, never inline SVG or a data URI.
      assert.ok(mail.html.includes('src="https://www.dcitc.org/logo.png"'));
      assert.ok(mail.html.includes('alt="Dhaka College Information & Technology Club"'));
      assert.ok(!mail.html.includes("data:image"), "logo must be a hosted URL");

      // The code is selectable text, exactly once in each body.
      assert.equal((mail.html.match(/123456/g) ?? []).length, 1, "code repeated in HTML");
      assert.equal((mail.text.match(/123456/g) ?? []).length, 1, "code repeated in text");
      assert.ok(mail.html.includes("Select the code above to copy it."));
      assert.ok(!/copy code/i.test(mail.html), "no non-functional copy control");

      for (const body of [mail.text, mail.html]) {
        assert.ok(body.includes("Dhaka College Information & Technology Club"), "club name missing");
        assert.match(body, /10 minutes/);
        assert.match(body, /ignore this email/);
      }
      assert.ok(mail.subject.includes("DCITC"));

      // No secret reaches the rendered message.
      assert.ok(!mail.html.includes(env.OTP_PEPPER));
      if (env.RESEND_API_KEY) assert.ok(!mail.html.includes(env.RESEND_API_KEY));
    });
  }
});

describe("mail failure handling", () => {
  const originalFetch = globalThis.fetch;
  const originalTransport = env.MAIL_TRANSPORT;
  const originalKey = env.RESEND_API_KEY;
  const originalFrom = env.EMAIL_FROM;
  const API_KEY = "re_test_key_never_log";
  const CODE = "123456";

  const useResend = () => {
    env.MAIL_TRANSPORT = "resend";
    env.RESEND_API_KEY = API_KEY;
    env.EMAIL_FROM = "no-reply@example.com";
  };

  const stubFetch = (impl: typeof fetch) => {
    const calls: { url: string; init?: RequestInit }[] = [];
    globalThis.fetch = (async (input: string | URL | Request, init?: RequestInit) => {
      calls.push({ url: String(input), init });
      return impl(input, init);
    }) as typeof fetch;
    return calls;
  };

  afterEach(() => {
    globalThis.fetch = originalFetch;
    env.MAIL_TRANSPORT = originalTransport;
    env.RESEND_API_KEY = originalKey;
    env.EMAIL_FROM = originalFrom;
    testOutbox.length = 0;
  });

  it("resolves when the provider accepts the message", async () => {
    useResend();
    stubFetch(async () => new Response(JSON.stringify({ id: "ok" }), { status: 200 }));
    await sendSignupOtp("recipient@example.com", CODE);
  });

  it("raises MailDeliveryError on a non-2xx response, logs no secrets, and does not retry", async () => {
    useResend();
    const calls = stubFetch(async () => new Response("nope", { status: 422 }));
    const logs: string[] = [];
    const originalError = console.error;
    console.error = (...args: unknown[]) => logs.push(args.join(" "));
    try {
      await assert.rejects(sendSignupOtp("secret-recipient@example.com", CODE), MailDeliveryError);
    } finally {
      console.error = originalError;
    }

    assert.equal(calls.length, 1, "a failed send must not be retried");
    assert.equal(logs.length, 1);
    assert.ok(!logs[0]!.includes(API_KEY));
    assert.ok(!logs[0]!.includes(CODE));
    assert.ok(!logs[0]!.includes("secret-recipient@example.com"));
    assert.ok(logs[0]!.includes("422"));
  });

  it("raises MailDeliveryError when the request rejects", async () => {
    useResend();
    stubFetch(async () => {
      throw new TypeError("network down");
    });
    await assert.rejects(sendSignupOtp("recipient@example.com", CODE), MailDeliveryError);
  });

  it("keeps the idempotency key stable per message and changes it with the code", async () => {
    useResend();
    const calls = stubFetch(async () => new Response(null, { status: 200 }));
    await sendSignupOtp("same@example.com", CODE);
    await sendSignupOtp("same@example.com", CODE);
    await sendSignupOtp("same@example.com", "654321");

    const keys = calls.map((call) => new Headers(call.init?.headers).get("Idempotency-Key"));
    assert.equal(keys[0], keys[1]);
    assert.notEqual(keys[0], keys[2]);
  });
});

describe("database TLS", () => {
  const remote = "postgresql://user:pass@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres";
  const local = "postgresql://postgres:postgres@127.0.0.1:54322/postgres";

  it("skips TLS for local hosts even in production", () => {
    assert.equal(sslConfig(local, "production"), false);
    assert.equal(sslConfig("postgresql://postgres:postgres@localhost:54322/postgres", "production"), false);
  });

  it("verifies the certificate for remote production connections", () => {
    assert.deepEqual(sslConfig(remote, "production"), { rejectUnauthorized: true });
  });

  it("keeps TLS off outside production", () => {
    assert.equal(sslConfig(remote, "development"), false);
    assert.equal(sslConfig(remote, "test"), false);
  });

  it("passes a configured CA without weakening verification", () => {
    assert.deepEqual(sslConfig(remote, "production", "PEM\\nLINE"), {
      rejectUnauthorized: true,
      ca: "PEM\nLINE",
    });
  });
});

describe("environment validation", () => {
  it("pins the mail transport to the log-only path", () => {
    assert.equal(env.MAIL_TRANSPORT, "log");
  });

  it("exits non-zero and names the missing variable", async () => {
    const env: NodeJS.ProcessEnv = { ...process.env, DOTENV_CONFIG_PATH: "does-not-exist.env" };
    delete env.DATABASE_URL;

    const result = await run(
      process.execPath,
      ["--import", "tsx", "-e", "import('./src/config/env.ts').catch(() => process.exit(1))"],
      { cwd: backendDir, env },
    ).then(
      () => ({ code: 0, stderr: "" }),
      (error: { code?: number; stderr?: string }) => ({ code: error.code ?? 1, stderr: error.stderr ?? "" }),
    );

    assert.notEqual(result.code, 0);
    assert.match(result.stderr, /DATABASE_URL/);
    // Never prints the (missing) value or any secret.
    assert.ok(!result.stderr.includes(process.env.JWT_USER_SECRET ?? "never-there"));
  });

  it("ignores the removed ADMIN_EMAIL and ADMIN_PASSWORD seeding variables", async () => {
    const env: NodeJS.ProcessEnv = {
      ...process.env,
      DOTENV_CONFIG_PATH: "does-not-exist.env",
      ADMIN_EMAIL: "legacy@example.com",
      ADMIN_PASSWORD: "LegacyAdmin123!",
    };
    const script =
      "import('./src/config/env.ts').then(({ env }) => console.log(JSON.stringify({ " +
      "hasEmail: 'ADMIN_EMAIL' in env, hasPassword: 'ADMIN_PASSWORD' in env })))";

    const { stdout } = await run(process.execPath, ["--import", "tsx", "-e", script], {
      cwd: backendDir,
      env,
    });

    assert.deepEqual(JSON.parse(stdout.trim()), { hasEmail: false, hasPassword: false });
  });
});
