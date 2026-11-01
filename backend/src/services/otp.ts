import { createHmac, randomInt, timingSafeEqual } from "node:crypto";
import { and, desc, eq, gt, isNull, lt, sql } from "drizzle-orm";
import { env } from "../config/env.js";
import { db } from "../db/pool.js";
import { otpCodes } from "../db/schema.js";
import { AppError, invalidOtp, otpExhausted, otpExpired } from "../lib/errors.js";

export type OtpPurpose = "signup" | "password_reset";

const TTL_MS = 10 * 60 * 1000;
const COOLDOWN_MS = 60 * 1000;
const MAX_ATTEMPTS = 5;
const MAX_PER_HOUR = 3;

const normalize = (email: string) => email.trim().toLowerCase();

function hashCode(code: string): string {
  return createHmac("sha256", env.OTP_PEPPER).update(code).digest("hex");
}

/** Constant-time comparison of the submitted code's HMAC with the stored one. */
function codeMatches(code: string, storedHex: string): boolean {
  const submitted = Buffer.from(hashCode(code), "hex");
  const stored = Buffer.from(storedHex, "hex");
  if (submitted.length !== stored.length || stored.length === 0) return false;
  return timingSafeEqual(submitted, stored);
}

function cooldownError(seconds: number): AppError {
  return new AppError(429, "rate_limited", "Wait before requesting another code.", undefined, {
    "Retry-After": String(Math.max(1, Math.ceil(seconds))),
  });
}

/** Create and store a fresh OTP after `deliver` succeeds, returning nothing. */
export async function issueOtp(
  email: string,
  purpose: OtpPurpose,
  deliver: (code: string) => Promise<void>,
): Promise<void> {
  const address = normalize(email);
  const now = new Date();

  const [latest] = await db
    .select({ createdAt: otpCodes.createdAt })
    .from(otpCodes)
    .where(and(eq(otpCodes.email, address), eq(otpCodes.purpose, purpose)))
    .orderBy(desc(otpCodes.createdAt))
    .limit(1);

  if (latest) {
    const elapsed = now.getTime() - latest.createdAt.getTime();
    if (elapsed < COOLDOWN_MS) throw cooldownError((COOLDOWN_MS - elapsed) / 1000);
  }

  const [{ count = 0 } = {}] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(otpCodes)
    .where(
      and(
        eq(otpCodes.email, address),
        eq(otpCodes.purpose, purpose),
        gt(otpCodes.createdAt, new Date(now.getTime() - 60 * 60 * 1000)),
      ),
    );
  if (count >= MAX_PER_HOUR) throw cooldownError(60 * 60 - 60);

  const code = String(randomInt(0, 1_000_000)).padStart(6, "0");

  // Send before invalidating anything: a delivery failure must leave the
  // previous code usable and must not start a cooldown.
  await deliver(code);

  const storedAt = new Date();
  await db.transaction(async (tx) => {
    // Only the newest code may be used.
    await tx
      .update(otpCodes)
      .set({ consumedAt: storedAt })
      .where(and(eq(otpCodes.email, address), eq(otpCodes.purpose, purpose), isNull(otpCodes.consumedAt)));
    await tx.insert(otpCodes).values({
      email: address,
      purpose,
      codeHash: hashCode(code),
      expiresAt: new Date(storedAt.getTime() + TTL_MS),
    });
  });
}

/** Verify a code, consuming it on success. Attempts are counted before comparison. */
export async function verifyOtp(email: string, purpose: OtpPurpose, code: string): Promise<void> {
  const address = normalize(email);
  const [row] = await db
    .select()
    .from(otpCodes)
    .where(and(eq(otpCodes.email, address), eq(otpCodes.purpose, purpose), isNull(otpCodes.consumedAt)))
    .orderBy(desc(otpCodes.createdAt))
    .limit(1);

  if (!row) throw invalidOtp();
  if (row.expiresAt.getTime() < Date.now()) {
    await db.update(otpCodes).set({ consumedAt: new Date() }).where(eq(otpCodes.id, row.id));
    throw otpExpired();
  }

  // One conditional statement, so concurrent guesses cannot share a stale count.
  const [counted] = await db
    .update(otpCodes)
    .set({ attempts: sql`${otpCodes.attempts} + 1` })
    .where(and(eq(otpCodes.id, row.id), isNull(otpCodes.consumedAt), lt(otpCodes.attempts, MAX_ATTEMPTS)))
    .returning({ attempts: otpCodes.attempts });

  if (!counted) {
    const [current] = await db
      .select({ consumedAt: otpCodes.consumedAt })
      .from(otpCodes)
      .where(eq(otpCodes.id, row.id))
      .limit(1);
    throw current?.consumedAt ? invalidOtp() : otpExhausted();
  }

  if (!codeMatches(code, row.codeHash)) {
    throw counted.attempts >= MAX_ATTEMPTS ? otpExhausted() : invalidOtp();
  }

  // Consume conditionally so two concurrent correct submissions cannot both succeed.
  const [consumed] = await db
    .update(otpCodes)
    .set({ consumedAt: new Date() })
    .where(and(eq(otpCodes.id, row.id), isNull(otpCodes.consumedAt)))
    .returning({ id: otpCodes.id });
  if (!consumed) throw invalidOtp();
}
