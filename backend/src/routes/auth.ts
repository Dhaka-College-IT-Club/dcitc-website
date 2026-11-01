import { randomUUID } from "node:crypto";
import { and, eq, sql } from "drizzle-orm";
import { Router } from "express";
import { z } from "zod";
import { env } from "../config/env.js";
import { db } from "../db/pool.js";
import { users } from "../db/schema.js";
import {
  clearOAuthStateCookie,
  clearUserCookie,
  OAUTH_STATE_COOKIE,
  setOAuthStateCookie,
  setUserCookie,
  USER_COOKIE,
} from "../lib/cookies.js";
import { AppError, deliveryFailed, emailNotFound, emailTaken, invalidCredentials, invalidOtp, isUniqueViolation, unauthenticated } from "../lib/errors.js";
import { signSignupToken, signOAuthState, signUserToken, verifyOAuthState, verifySignupToken, verifyUserToken } from "../lib/jwt.js";
import { hashPassword, verifyPassword } from "../lib/password.js";
import { toUser } from "../lib/serialize.js";
import { MailDeliveryError, otpSenders, sendEmailRecovery } from "../mail/index.js";
import { requireUser } from "../middleware/auth.js";
import {
  authLimiter,
  loginIpLimiter,
  loginLimiter,
  otpIpLimiter,
  otpLimiter,
  passwordResetLimiter,
} from "../middleware/rateLimit.js";
import { validate } from "../middleware/validate.js";
import { buildAuthorizeUrl, currentGoogleClient, GoogleExchangeError, resolveGoogleUser } from "../services/google.js";
import { issueOtp, verifyOtp } from "../services/otp.js";

export const authRouter = Router();

const emailField = z.string().trim().toLowerCase().email().max(254);
const passwordField = z.string().min(8, "Use at least 8 characters.").max(200);
const codeField = z.string().regex(/^\d{6}$/, "Enter the six-digit code.");

const emailOnly = z.object({ email: emailField });

const signupVerify = z.object({ email: emailField, code: codeField });

const signupComplete = z.object({
  signupToken: z.string().min(1),
  name: z.string().trim().min(1, "Enter your name.").max(100),
  hscBatch: z.string().trim().max(50).default(""),
  password: passwordField,
});

const loginBody = z.object({ email: emailField, password: z.string().min(1).max(200) });

const passwordChange = z.object({
  currentPassword: z.string().min(1),
  newPassword: passwordField,
});

const passwordReset = z.object({ email: emailField, code: codeField, password: passwordField });

const recoveryBody = z.object({
  name: z.string().trim().min(1).max(100),
  hscBatch: z.string().trim().min(1).max(50),
});

let dummyHash: Promise<string> | null = null;
function getDummyHash(): Promise<string> {
  dummyHash ??= hashPassword(randomUUID());
  return dummyHash;
}

async function isEmailTaken(email: string): Promise<boolean> {
  const [row] = await db
    .select({ id: users.id })
    .from(users)
    .where(sql`lower(${users.email}) = ${email}`)
    .limit(1);
  return Boolean(row);
}

authRouter.post(
  "/signup/request-otp",
  otpIpLimiter,
  otpLimiter,
  validate({ body: emailOnly }),
  async (req, res, next) => {
    const email = req.body.email as string;
    if (await isEmailTaken(email)) return next(emailTaken());

    try {
      await issueOtp(email, "signup", (code) => otpSenders.signup(email, code));
    } catch (error) {
      if (error instanceof MailDeliveryError) return next(deliveryFailed());
      return next(error);
    }

    res.json({ data: { sent: true } });
  },
);

authRouter.post(
  "/signup/verify-otp",
  otpIpLimiter,
  otpLimiter,
  validate({ body: signupVerify }),
  async (req, res) => {
    const { email, code } = req.body as z.infer<typeof signupVerify>;
    await verifyOtp(email, "signup", code);
    res.json({ data: { signupToken: signSignupToken(email) } });
  },
);

authRouter.post(
  "/signup/complete",
  authLimiter,
  validate({ body: signupComplete }),
  async (req, res, next) => {
    const { signupToken, name, hscBatch, password } = req.body as z.infer<typeof signupComplete>;
    const email = verifySignupToken(signupToken);
    if (!email) return next(unauthenticated("Your signup session expired. Start again."));

    try {
      const [row] = await db
        .insert(users)
        .values({ email, name, hscBatch, passwordHash: await hashPassword(password) })
        .returning();
      if (!row) return next(new AppError(500, "internal_error", "Could not create the account."));
      setUserCookie(res, signUserToken(row.id, row.tokenVersion));
      res.status(201).json({ data: toUser(row) });
    } catch (error) {
      if (isUniqueViolation(error)) return next(emailTaken());
      next(error);
    }
  },
);

authRouter.post("/login", loginIpLimiter, loginLimiter, validate({ body: loginBody }), async (req, res, next) => {
  const { email, password } = req.body as z.infer<typeof loginBody>;
  const [row] = await db
    .select()
    .from(users)
    .where(sql`lower(${users.email}) = ${email}`)
    .limit(1);

  const hash = row?.passwordHash;
  if (!row || !hash) {
    // Burn comparable time on unknown accounts so response timing does not leak existence.
    await verifyPassword(password, await getDummyHash());
    return next(invalidCredentials());
  }
  if (!(await verifyPassword(password, hash))) return next(invalidCredentials());

  setUserCookie(res, signUserToken(row.id, row.tokenVersion));
  res.json({ data: toUser(row) });
});

authRouter.post("/logout", async (req, res) => {
  // Revoke every session for the account, not just this browser's cookie. An
  // absent or invalid cookie is still a successful logout for the caller.
  const token = req.cookies?.[USER_COOKIE] as string | undefined;
  const payload = token ? verifyUserToken(token) : null;
  if (payload) {
    await db
      .update(users)
      .set({ tokenVersion: sql`${users.tokenVersion} + 1`, updatedAt: new Date() })
      .where(eq(users.id, payload.sub));
  }
  clearUserCookie(res);
  res.status(204).end();
});

authRouter.get("/me", requireUser, (req, res) => {
  res.json({ data: toUser(req.currentUser!) });
});

authRouter.patch(
  "/password",
  requireUser,
  validate({ body: passwordChange }),
  async (req, res, next) => {
    const user = req.currentUser!;
    const { currentPassword, newPassword } = req.body as z.infer<typeof passwordChange>;

    if (!user.passwordHash) {
      return next(new AppError(400, "validation_failed", "This account uses Google sign-in.", { currentPassword: "No password is set." }));
    }
    if (!(await verifyPassword(currentPassword, user.passwordHash))) {
      return next(invalidCredentials());
    }

    const [row] = await db
      .update(users)
      .set({
        passwordHash: await hashPassword(newPassword),
        tokenVersion: user.tokenVersion + 1,
        updatedAt: new Date(),
      })
      .where(eq(users.id, user.id))
      .returning();
    if (!row) return next(new AppError(500, "internal_error", "Could not update the password."));

    setUserCookie(res, signUserToken(row.id, row.tokenVersion));
    res.json({ data: { updated: true } });
  },
);

authRouter.post(
  "/password/forgot",
  otpIpLimiter,
  passwordResetLimiter,
  validate({ body: emailOnly }),
  async (req, res, next) => {
    const email = req.body.email as string;
    if (!(await isEmailTaken(email))) return next(emailNotFound());

    try {
      await issueOtp(email, "password_reset", (code) => otpSenders.reset(email, code));
    } catch (error) {
      if (error instanceof MailDeliveryError) return next(deliveryFailed());
      return next(error);
    }

    res.json({ data: { sent: true } });
  },
);

authRouter.post(
  "/password/reset",
  otpIpLimiter,
  passwordResetLimiter,
  validate({ body: passwordReset }),
  async (req, res, next) => {
    const { email, code, password } = req.body as z.infer<typeof passwordReset>;
    await verifyOtp(email, "password_reset", code);

    const [row] = await db
      .update(users)
      .set({
        passwordHash: await hashPassword(password),
        tokenVersion: sql`${users.tokenVersion} + 1`,
        updatedAt: new Date(),
      })
      .where(sql`lower(${users.email}) = ${email}`)
      .returning();
    if (!row) return next(invalidOtp());

    res.json({ data: { reset: true } });
  },
);

authRouter.post(
  "/email/recover",
  authLimiter,
  validate({ body: recoveryBody }),
  async (req, res) => {
    const { name, hscBatch } = req.body as z.infer<typeof recoveryBody>;
    const [row] = await db
      .select()
      .from(users)
      .where(
        and(
          sql`lower(${users.name}) = ${name.toLowerCase()}`,
          sql`lower(${users.hscBatch}) = ${hscBatch.toLowerCase()}`,
        ),
      )
      .limit(1);

    if (row) {
      try {
        await sendEmailRecovery(row.email, row.name);
      } catch {
        // Stay generic.
      }
    }
    res.json({ data: { sent: true } });
  },
);

authRouter.get("/google/start", (_req, res) => {
  const state = signOAuthState(randomUUID());
  setOAuthStateCookie(res, state);
  res.redirect(buildAuthorizeUrl(state));
});

authRouter.get("/google/callback", async (req, res) => {
  const redirect = (path: string) => res.redirect(`${env.FRONTEND_URL.replace(/\/$/, "")}${path}`);
  const fail = (reason: string) => {
    clearOAuthStateCookie(res);
    redirect(`/login?error=${reason}`);
  };

  const code = typeof req.query.code === "string" ? req.query.code : "";
  const state = typeof req.query.state === "string" ? req.query.state : "";
  const cookieState = req.cookies?.[OAUTH_STATE_COOKIE] as string | undefined;

  const googleError = typeof req.query.error === "string" ? req.query.error.slice(0, 100) : "";
  if (googleError) {
    const description =
      typeof req.query.error_description === "string" ? req.query.error_description.slice(0, 200) : "";
    console.error(
      JSON.stringify({ level: "warn", message: "google_oauth_denied", error: googleError, description }),
    );
    return fail("oauth_denied");
  }

  if (!code || !state || !cookieState) return fail("oauth_state");
  const nonce = verifyOAuthState(state);
  const cookieNonce = verifyOAuthState(cookieState);
  if (!nonce || !cookieNonce || nonce !== cookieNonce) return fail("oauth_state");

  let step: "exchange" | "verify" | "user" = "exchange";
  try {
    const client = currentGoogleClient();
    const idToken = await client.exchangeCode(code);
    step = "verify";
    const profile = await client.verifyIdToken(idToken);
    if (!profile || !profile.emailVerified) return fail("oauth_email");

    step = "user";
    const user = await resolveGoogleUser(profile);
    setUserCookie(res, signUserToken(user.id, user.tokenVersion));
    clearOAuthStateCookie(res);
    redirect("/dashboard");
  } catch (error) {
    const failure = error instanceof Error ? error : new Error(String(error));
    const detail =
      error instanceof GoogleExchangeError
        ? error.description || error.code
        : failure.message;
    console.error(
      JSON.stringify({
        level: "error",
        message: "google_oauth_failed",
        step,
        name: failure.name,
        detail: detail.slice(0, 300),
      }),
    );
    return fail("oauth_failed");
  }
});
