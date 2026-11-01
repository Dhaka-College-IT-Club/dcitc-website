import { ipKeyGenerator, rateLimit } from "express-rate-limit";
import type { Request } from "express";
import { AppError } from "../lib/errors.js";

function limitHandler(_req: Request, _res: unknown, next: (error: unknown) => void): void {
  next(new AppError(429, "rate_limited", "Too many requests. Try again later."));
}

const shared = {
  standardHeaders: true as const,
  legacyHeaders: false,
  handler: limitHandler,
  skip: () => process.env.NODE_ENV === "test" && process.env.RATE_LIMIT_DISABLED === "1",
};

const byIp = (req: Request) => ipKeyGenerator(req.ip ?? "0.0.0.0");

export const authLimiter = rateLimit({
  ...shared,
  windowMs: 15 * 60 * 1000,
  limit: 10,
  keyGenerator: byIp,
});

/**
 * Login is throttled per source address *and* submitted email, so targeted
 * guessing against one account has its own bucket instead of sharing the
 * source-wide budget with unrelated emails.
 */
export const loginLimiter = rateLimit({
  ...shared,
  windowMs: 15 * 60 * 1000,
  limit: 10,
  keyGenerator: (req) => {
    const email = typeof req.body?.email === "string" ? req.body.email.toLowerCase() : "";
    return `${byIp(req)}:${email}`;
  },
});

export const adminLoginLimiter = rateLimit({
  ...shared,
  windowMs: 15 * 60 * 1000,
  limit: 5,
  keyGenerator: (req) => {
    const email = typeof req.body?.email === "string" ? req.body.email.toLowerCase() : "";
    return `${byIp(req)}:${email}`;
  },
});

export const otpLimiter = rateLimit({
  ...shared,
  windowMs: 60 * 60 * 1000,
  limit: 10,
  keyGenerator: byIp,
});

export const passwordResetLimiter = rateLimit({
  ...shared,
  windowMs: 60 * 60 * 1000,
  limit: 5,
  keyGenerator: byIp,
});

export const contactLimiter = rateLimit({
  ...shared,
  windowMs: 60 * 60 * 1000,
  limit: 5,
  keyGenerator: byIp,
});

export const uploadLimiter = rateLimit({
  ...shared,
  windowMs: 60 * 60 * 1000,
  limit: 60,
  keyGenerator: (req) => req.currentAdmin?.id ?? byIp(req),
});
