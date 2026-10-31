import { createHmac, randomInt } from "node:crypto";
import { and, desc, eq, gt, isNull, sql } from "drizzle-orm";
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

function cooldownError(seconds: number): AppError {
  return new AppError(429, "rate_limited", "Wait before requesting another code.", undefined, {
    "Retry-After": String(Math.max(1, Math.ceil(seconds))),
  });
}

/** Create and store a fresh OTP. Returns the plain code so the caller can mail it. */
export async function issueOtp(email: string, purpose: OtpPurpose): Promise<string> {
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

  // Only the newest code may be used.
  await db
    .update(otpCodes)
    .set({ consumedAt: now })
    .where(and(eq(otpCodes.email, address), eq(otpCodes.purpose, purpose), isNull(otpCodes.consumedAt)));

  const code = String(randomInt(0, 1_000_000)).padStart(6, "0");
  await db.insert(otpCodes).values({
    email: address,
    purpose,
    codeHash: hashCode(code),
    expiresAt: new Date(now.getTime() + TTL_MS),
  });
  return code;
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
  if (row.attempts >= MAX_ATTEMPTS) throw otpExhausted();

  const [updated] = await db
    .update(otpCodes)
    .set({ attempts: row.attempts + 1 })
    .where(eq(otpCodes.id, row.id))
    .returning({ attempts: otpCodes.attempts });
  const attempts = updated?.attempts ?? MAX_ATTEMPTS;

  if (hashCode(code) !== row.codeHash) {
    throw attempts >= MAX_ATTEMPTS ? otpExhausted() : invalidOtp();
  }

  await db.update(otpCodes).set({ consumedAt: new Date() }).where(eq(otpCodes.id, row.id));
}
