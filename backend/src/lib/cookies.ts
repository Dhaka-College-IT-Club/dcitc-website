import type { CookieOptions, Response } from "express";
import { isProduction } from "../config/env.js";

export const USER_COOKIE = "dcitc_at";
export const ADMIN_COOKIE = "dcitc_admin";
export const OAUTH_STATE_COOKIE = "dcitc_oauth_state";

const DAY = 24 * 60 * 60 * 1000;

const base: CookieOptions = {
  httpOnly: true,
  sameSite: "lax",
  secure: isProduction,
  path: "/",
};

export function setUserCookie(res: Response, token: string): void {
  res.cookie(USER_COOKIE, token, { ...base, maxAge: 7 * DAY });
}

export function clearUserCookie(res: Response): void {
  res.clearCookie(USER_COOKIE, base);
}

export function setAdminCookie(res: Response, token: string): void {
  res.cookie(ADMIN_COOKIE, token, { ...base, maxAge: 7 * DAY });
}

export function clearAdminCookie(res: Response): void {
  res.clearCookie(ADMIN_COOKIE, base);
}

export function setOAuthStateCookie(res: Response, token: string): void {
  res.cookie(OAUTH_STATE_COOKIE, token, { ...base, maxAge: 5 * 60 * 1000 });
}

export function clearOAuthStateCookie(res: Response): void {
  res.clearCookie(OAUTH_STATE_COOKIE, base);
}
