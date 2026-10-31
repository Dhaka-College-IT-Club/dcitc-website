import "./setup.js";
import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { fileURLToPath } from "node:url";
import { describe, it } from "node:test";
import { hashPassword, verifyPassword } from "../src/lib/password.js";
import { signAdminToken, signUserToken, verifyAdminToken, verifyUserToken } from "../src/lib/jwt.js";
import { verifyGoogleIdToken } from "../src/services/google.js";
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
});
