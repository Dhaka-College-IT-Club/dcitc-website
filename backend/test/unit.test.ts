import "./setup.js";
import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { fileURLToPath } from "node:url";
import { describe, it } from "node:test";
import { hashPassword, verifyPassword } from "../src/lib/password.js";
import { signAdminToken, signUserToken, verifyAdminToken, verifyUserToken } from "../src/lib/jwt.js";
import { GoogleExchangeError, googleClient, verifyGoogleIdToken } from "../src/services/google.js";
import { sslConfig } from "../src/db/ssl.js";
import { renderOtpEmail } from "../src/mail/index.js";
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
    it(`renders the code and club name for ${kind}`, () => {
      const mail = renderOtpEmail(kind, "123456");
      for (const body of [mail.text, mail.html]) {
        assert.ok(body.includes("123456"), "code missing from the message");
        assert.ok(body.includes("Dhaka College Information & Technology Club"), "club name missing");
        assert.match(body, /10 minutes/);
        assert.match(body, /ignore this email/);
      }
      assert.ok(mail.subject.includes("DCITC"));
      assert.equal(mail.html.includes("<img"), false, "template must not use external images");
    });
  }
});

describe("mail failure handling", () => {
  it("retries once, throws a generic error, and logs neither the code nor the recipient", async () => {
    const env: NodeJS.ProcessEnv = {
      ...process.env,
      MAIL_TRANSPORT: "smtp",
      SMTP_HOST: "127.0.0.1",
      SMTP_PORT: "1",
      SMTP_FROM: "DCITC <no-reply@dcitc.local>",
      SMTP_SECURE: "false",
    };

    const script = `
      import('./src/mail/index.js').then(async (mail) => {
        try {
          await mail.sendSignupOtp('secret-recipient@example.com', '123456');
          process.exit(2);
        } catch (error) {
          process.exit(error && error.name === 'MailDeliveryError' ? 0 : 3);
        }
      });
    `;

    const result = await run(process.execPath, ["--import", "tsx", "-e", script], {
      cwd: backendDir,
      env,
    }).then(
      (value) => ({ code: 0, output: `${value.stdout}${value.stderr}` }),
      (error: { code?: number; stdout?: string; stderr?: string }) => ({
        code: error.code ?? 1,
        output: `${error.stdout ?? ""}${error.stderr ?? ""}`,
      }),
    );

    assert.equal(result.code, 0, `expected MailDeliveryError, got exit ${result.code}`);
    assert.ok(!result.output.includes("123456"));
    assert.ok(!result.output.includes("secret-recipient@example.com"));
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
