import { eq } from "drizzle-orm";
import type { NextFunction, Request, Response } from "express";
import { db } from "../db/pool.js";
import { admins, users } from "../db/schema.js";
import { ADMIN_COOKIE, USER_COOKIE } from "../lib/cookies.js";
import { forbidden, unauthenticated } from "../lib/errors.js";
import { verifyAdminToken, verifyUserToken } from "../lib/jwt.js";

export type CurrentUser = typeof users.$inferSelect;
export type CurrentAdmin = typeof admins.$inferSelect;

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      currentUser?: CurrentUser;
      currentAdmin?: CurrentAdmin;
    }
  }
}

export async function requireUser(req: Request, _res: Response, next: NextFunction): Promise<void> {
  const token = req.cookies?.[USER_COOKIE] as string | undefined;
  const payload = token ? verifyUserToken(token) : null;
  if (!payload) return next(unauthenticated());

  const [row] = await db.select().from(users).where(eq(users.id, payload.sub)).limit(1);
  if (!row || row.tokenVersion !== payload.tv) return next(unauthenticated());

  req.currentUser = row;
  next();
}

export async function requireAdmin(req: Request, _res: Response, next: NextFunction): Promise<void> {
  const token = req.cookies?.[ADMIN_COOKIE] as string | undefined;
  const payload = token ? verifyAdminToken(token) : null;
  if (!payload) return next(unauthenticated());

  const [row] = await db.select().from(admins).where(eq(admins.id, payload.sub)).limit(1);
  if (!row || !row.active || row.tokenVersion !== payload.tv) return next(unauthenticated());

  req.currentAdmin = row;
  next();
}

export async function requireSuperAdmin(req: Request, res: Response, next: NextFunction): Promise<void> {
  await requireAdmin(req, res, (error?: unknown) => {
    if (error) return next(error);
    if (req.currentAdmin?.role !== "super_admin") return next(forbidden());
    next();
  });
}
