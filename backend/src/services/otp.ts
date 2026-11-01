import { createHmac, randomInt, timingSafeEqual } from "node:crypto";
import { and, desc, eq, gt, isNull, ne, sql } from "drizzle-orm";
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

/**
 * Create, store, and deliver a fresh OTP. The row is written before delivery so a
 * code cannot be mailed without existing; a failed send removes only that row.
 */
export async function issueOtp(
  email: string,
  purpose: OtpPurpose,
  send: (code: string) => Promise<void>,
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
  const [row] = await db
    .insert(otpCodes)
    .values({
      email: address,
      purpose,
      codeHash: hashCode(code),
      expiresAt: new Date(now.getTime() + TTL_MS),
    })
    .returning({ id: otpCodes.id });

  try {
    await send(code);
  } catch (error) {
    // Leave the previous code usable and start no cooldown.
    if (row) await db.delete(otpCodes).where(eq(otpCodes.id, row.id));
    throw error;
  }

  // Only a confirmed send invalidates older codes: only the newest may be used.
  if (row) {
    await db
      .update(otpCodes)
      .set({ consumedAt: new Date() })
      .where(
        and(
          eq(otpCodes.email, address),
          eq(otpCodes.purpose, purpose),
          isNull(otpCodes.consumedAt),
          ne(otpCodes.id, row.id),
        ),
      );
  }
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

  if (!codeMatches(code, row.codeHash)) {
    throw attempts >= MAX_ATTEMPTS ? otpExhausted() : invalidOtp();
  }

  await db.update(otpCodes).set({ consumedAt: new Date() }).where(eq(otpCodes.id, row.id));
}
