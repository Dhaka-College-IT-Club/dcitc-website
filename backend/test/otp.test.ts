import "./setup.js";
import assert from "node:assert/strict";
import { after, before, describe, it } from "node:test";
import { and, eq } from "drizzle-orm";
import { db } from "../src/db/pool.js";
import { otpCodes, users } from "../src/db/schema.js";
import { MailDeliveryError, otpSenders, sendResetOtp, sendSignupOtp } from "../src/mail/index.js";
import { issueOtp, verifyOtp } from "../src/services/otp.js";
import { ageRecentOtp, closePool, hasTestDb, prepareDatabase } from "./db.js";
import { Client, startServer } from "./helpers.js";

let client: Client;
let close: () => Promise<void>;
const dbIt = hasTestDb ? it : it.skip;

before(async () => {
  if (!hasTestDb) return;
  await prepareDatabase();
  const started = await startServer();
  client = started.client;
  close = started.close;
});

after(async () => {
  if (!hasTestDb) return;
  otpSenders.signup = sendSignupOtp;
  otpSenders.reset = sendResetOtp;
  await close();
  await closePool();
});

describe("OTP issuance", () => {
  dbIt("keeps the previous code usable and starts no cooldown when delivery fails", async () => {
    const email = "otp-delivery-failure@example.com";
    let first = "";
    await issueOtp(email, "signup", async (code) => {
      first = code;
    });
    await ageRecentOtp(email);

    await assert.rejects(
      issueOtp(email, "signup", async () => {
        throw new MailDeliveryError();
      }),
      (error: unknown) => error instanceof MailDeliveryError,
    );

    // The previously delivered code still works.
    await verifyOtp(email, "signup", first);

    // And no cooldown was started by the failed attempt.
    let second = "";
    await issueOtp(email, "signup", async (code) => {
      second = code;
    });
    assert.notEqual(second, first);
  });

  dbIt("invalidates the previous code only after a successful resend", async () => {
    const email = "otp-successful-resend@example.com";
    let first = "";
    await issueOtp(email, "signup", async (code) => {
      first = code;
    });
    await ageRecentOtp(email);

    let second = "";
    await issueOtp(email, "signup", async (code) => {
      second = code;
    });

    await assert.rejects(verifyOtp(email, "signup", first), (error: unknown) => {
      return (error as { code?: string }).code === "invalid_otp";
    });
    await verifyOtp(email, "signup", second);
  });

  dbIt("returns delivery_failed without losing the old code on signup", async () => {
    const email = "otp-route-signup@example.com";
    let oldCode = "";
    await issueOtp(email, "signup", async (code) => {
      oldCode = code;
    });
    await ageRecentOtp(email);

    const original = otpSenders.signup;
    otpSenders.signup = async () => {
      throw new MailDeliveryError();
    };
    try {
      const response = await client.req("/api/v2/auth/signup/request-otp", { body: { email } });
      assert.equal(response.status, 502);
      assert.equal(response.body.error.code, "delivery_failed");
      assert.equal(response.setCookies.some((cookie) => cookie.startsWith("dcitc_at=")), false);
    } finally {
      otpSenders.signup = original;
    }

    await verifyOtp(email, "signup", oldCode);
  });

  dbIt("returns delivery_failed without losing the old code on password reset", async () => {
    const email = "otp-route-reset@example.com";
    await db.insert(users).values({ email, name: "Reset User", hscBatch: "DC-27" });
    let oldCode = "";
    await issueOtp(email, "password_reset", async (code) => {
      oldCode = code;
    });
    await ageRecentOtp(email);

    const original = otpSenders.reset;
    otpSenders.reset = async () => {
      throw new MailDeliveryError();
    };
    try {
      const response = await client.req("/api/v2/auth/password/forgot", { body: { email } });
      assert.equal(response.status, 502);
      assert.equal(response.body.error.code, "delivery_failed");
    } finally {
      otpSenders.reset = original;
    }

    await verifyOtp(email, "password_reset", oldCode);
  });
});

describe("OTP verification", () => {
  const latestAttempts = async (email: string) => {
    const [row] = await db
      .select({ attempts: otpCodes.attempts, consumedAt: otpCodes.consumedAt })
      .from(otpCodes)
      .where(and(eq(otpCodes.email, email), eq(otpCodes.purpose, "signup")))
      .orderBy(otpCodes.createdAt)
      .limit(1);
    return row;
  };

  dbIt("counts no more than five attempts under concurrent wrong guesses", async () => {
    const email = "otp-concurrent-wrong@example.com";
    let code = "";
    await issueOtp(email, "signup", async (value) => {
      code = value;
    });
    const wrong = code === "000000" ? "000001" : "000000";

    const results = await Promise.allSettled(
      Array.from({ length: 6 }, () => verifyOtp(email, "signup", wrong)),
    );
    assert.equal(results.filter((result) => result.status === "fulfilled").length, 0);

    const row = await latestAttempts(email);
    assert.equal(row?.attempts, 5);

    // The correct code is refused after the limit is reached.
    await assert.rejects(verifyOtp(email, "signup", code), (error: unknown) => {
      return (error as { code?: string }).code === "otp_exhausted";
    });
  });

  dbIt("lets exactly one concurrent correct submission consume the code", async () => {
    const email = "otp-concurrent-correct@example.com";
    let code = "";
    await issueOtp(email, "signup", async (value) => {
      code = value;
    });

    const results = await Promise.allSettled([
      verifyOtp(email, "signup", code),
      verifyOtp(email, "signup", code),
    ]);
    assert.equal(results.filter((result) => result.status === "fulfilled").length, 1);

    const rejected = results.find((result) => result.status === "rejected") as PromiseRejectedResult;
    assert.equal((rejected.reason as { code?: string }).code, "invalid_otp");

    const row = await latestAttempts(email);
    assert.ok(row?.consumedAt, "the code must be consumed");
  });
});
