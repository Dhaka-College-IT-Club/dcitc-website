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
} from "../lib/cookies.js";
import { AppError, emailTaken, invalidCredentials, invalidOtp, isUniqueViolation, unauthenticated } from "../lib/errors.js";
import { signSignupToken, signOAuthState, signUserToken, verifyOAuthState, verifySignupToken } from "../lib/jwt.js";
import { hashPassword, verifyPassword } from "../lib/password.js";
import { toUser } from "../lib/serialize.js";
import { sendEmailRecovery, sendResetOtp, sendSignupOtp } from "../mail/index.js";
import { requireUser } from "../middleware/auth.js";
import { authLimiter, otpLimiter, passwordResetLimiter } from "../middleware/rateLimit.js";
import { validate } from "../middleware/validate.js";
import { buildAuthorizeUrl, currentGoogleClient, resolveGoogleUser } from "../services/google.js";
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
  otpLimiter,
  validate({ body: emailOnly }),
  async (req, res) => {
    const email = req.body.email as string;
    if (!(await isEmailTaken(email))) {
      try {
        const code = await issueOtp(email, "signup");
        await sendSignupOtp(email, code);
      } catch (error) {
        // Mail failures must not change the response or reveal anything.
        if (!(error instanceof AppError)) {
          console.error(JSON.stringify({ level: "error", message: "signup_otp_send_failed" }));
        } else {
          throw error;
        }
      }
    }
    res.json({ data: { sent: true } });
  },
);

authRouter.post(
  "/signup/verify-otp",
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

authRouter.post("/login", authLimiter, validate({ body: loginBody }), async (req, res, next) => {
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

authRouter.post("/logout", (_req, res) => {
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
  passwordResetLimiter,
  validate({ body: emailOnly }),
  async (req, res) => {
    const email = req.body.email as string;
    if (await isEmailTaken(email)) {
      try {
        const code = await issueOtp(email, "password_reset");
        await sendResetOtp(email, code);
      } catch (error) {
        if (!(error instanceof AppError)) {
          console.error(JSON.stringify({ level: "error", message: "reset_otp_send_failed" }));
        } else {
          throw error;
        }
      }
    }
    res.json({ data: { sent: true } });
  },
);

authRouter.post(
  "/password/reset",
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

  if (!code || !state || !cookieState) return fail("oauth_state");
  const nonce = verifyOAuthState(state);
  const cookieNonce = verifyOAuthState(cookieState);
  if (!nonce || !cookieNonce || nonce !== cookieNonce) return fail("oauth_state");

  try {
    const client = currentGoogleClient();
    const idToken = await client.exchangeCode(code);
    const profile = await client.verifyIdToken(idToken);
    if (!profile || !profile.emailVerified) return fail("oauth_email");

    const user = await resolveGoogleUser(profile);
    setUserCookie(res, signUserToken(user.id, user.tokenVersion));
    clearOAuthStateCookie(res);
    redirect("/dashboard");
  } catch {
    return fail("oauth_failed");
  }
});
