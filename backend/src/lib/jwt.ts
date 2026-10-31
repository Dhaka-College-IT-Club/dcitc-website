import jwt from "jsonwebtoken";
import { env } from "../config/env.js";

export type AdminRole = "admin" | "super_admin";

export type UserToken = { sub: string; typ: "user"; tv: number };
export type AdminToken = { sub: string; typ: "admin"; role: AdminRole; tv: number };

const SESSION_TTL = "7d";

export function signUserToken(userId: string, tokenVersion: number): string {
  return jwt.sign({ typ: "user", tv: tokenVersion }, env.JWT_USER_SECRET, {
    subject: userId,
    expiresIn: SESSION_TTL,
  });
}

export function verifyUserToken(token: string): UserToken | null {
  try {
    const payload = jwt.verify(token, env.JWT_USER_SECRET) as jwt.JwtPayload;
    if (payload.typ !== "user" || typeof payload.sub !== "string" || typeof payload.tv !== "number") {
      return null;
    }
    return { sub: payload.sub, typ: "user", tv: payload.tv };
  } catch {
    return null;
  }
}

export function signAdminToken(adminId: string, role: AdminRole, tokenVersion: number): string {
  return jwt.sign({ typ: "admin", role, tv: tokenVersion }, env.JWT_ADMIN_SECRET, {
    subject: adminId,
    expiresIn: SESSION_TTL,
  });
}

export function verifyAdminToken(token: string): AdminToken | null {
  try {
    const payload = jwt.verify(token, env.JWT_ADMIN_SECRET) as jwt.JwtPayload;
    if (
      payload.typ !== "admin" ||
      typeof payload.sub !== "string" ||
      typeof payload.tv !== "number" ||
      (payload.role !== "admin" && payload.role !== "super_admin")
    ) {
      return null;
    }
    return { sub: payload.sub, typ: "admin", role: payload.role, tv: payload.tv };
  } catch {
    return null;
  }
}

/** Short-lived token that proves an email passed the OTP step. */
export function signSignupToken(email: string): string {
  return jwt.sign({ typ: "signup", email }, env.JWT_USER_SECRET, { expiresIn: "15m" });
}

export function verifySignupToken(token: string): string | null {
  try {
    const payload = jwt.verify(token, env.JWT_USER_SECRET) as jwt.JwtPayload;
    if (payload.typ !== "signup" || typeof payload.email !== "string") return null;
    return payload.email;
  } catch {
    return null;
  }
}

/** Signed OAuth state, mirrored in a short-lived cookie and in the query string. */
export function signOAuthState(nonce: string): string {
  return jwt.sign({ typ: "oauth_state", nonce }, env.JWT_ADMIN_SECRET, { expiresIn: "5m" });
}

export function verifyOAuthState(token: string): string | null {
  try {
    const payload = jwt.verify(token, env.JWT_ADMIN_SECRET) as jwt.JwtPayload;
    if (payload.typ !== "oauth_state" || typeof payload.nonce !== "string") return null;
    return payload.nonce;
  } catch {
    return null;
  }
}
