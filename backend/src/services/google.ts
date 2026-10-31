import { and, eq, isNull, sql } from "drizzle-orm";
import { createRemoteJWKSet, jwtVerify } from "jose";
import { env, googleRedirectUri } from "../config/env.js";
import { db } from "../db/pool.js";
import { users } from "../db/schema.js";

export type GoogleProfile = {
  sub: string;
  email: string;
  emailVerified: boolean;
  name: string;
};

export interface GoogleClient {
  exchangeCode(code: string): Promise<string>;
  verifyIdToken(idToken: string): Promise<GoogleProfile | null>;
}

const JWKS = createRemoteJWKSet(new URL("https://www.googleapis.com/oauth2/v3/certs"));

export async function verifyGoogleIdToken(
  idToken: string,
  jwks: Parameters<typeof jwtVerify>[1] = JWKS,
  audience: string = env.GOOGLE_CLIENT_ID,
): Promise<GoogleProfile | null> {
  try {
    const { payload } = await jwtVerify(idToken, jwks, {
      issuer: ["https://accounts.google.com", "accounts.google.com"],
      audience,
    });
    if (typeof payload.sub !== "string" || typeof payload.email !== "string") return null;
    return {
      sub: payload.sub,
      email: payload.email,
      emailVerified: payload.email_verified === true,
      name: typeof payload.name === "string" && payload.name.trim() ? payload.name : payload.email.split("@")[0]!,
    };
  } catch {
    return null;
  }
}

export const googleClient: GoogleClient = {
  async exchangeCode(code: string) {
    const body = new URLSearchParams({
      code,
      client_id: env.GOOGLE_CLIENT_ID,
      client_secret: env.GOOGLE_CLIENT_SECRET,
      redirect_uri: googleRedirectUri,
      grant_type: "authorization_code",
    });
    const response = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body,
    });
    if (!response.ok) throw new Error("google_token_exchange_failed");
    const json = (await response.json()) as { id_token?: string };
    if (!json.id_token) throw new Error("google_id_token_missing");
    return json.id_token;
  },

  async verifyIdToken(idToken: string) {
    return verifyGoogleIdToken(idToken);
  },
};

let active: GoogleClient = googleClient;

/** Tests replace the client; nothing else in production calls this. */
export function setGoogleClient(next: GoogleClient): void {
  active = next;
}

export function currentGoogleClient(): GoogleClient {
  return active;
}

export function buildAuthorizeUrl(state: string): string {
  const url = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  url.searchParams.set("client_id", env.GOOGLE_CLIENT_ID);
  url.searchParams.set("redirect_uri", googleRedirectUri);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", "openid email profile");
  url.searchParams.set("state", state);
  url.searchParams.set("prompt", "select_account");
  return url.toString();
}

export type ResolvedUser = typeof users.$inferSelect;

/** google_sub → verified email (link) → create. */
export async function resolveGoogleUser(profile: GoogleProfile): Promise<ResolvedUser> {
  const bySub = await db.select().from(users).where(eq(users.googleSub, profile.sub)).limit(1);
  if (bySub[0]) return bySub[0];

  const email = profile.email.trim().toLowerCase();
  const byEmail = await db
    .select()
    .from(users)
    .where(sql`lower(${users.email}) = ${email}`)
    .limit(1);

  if (byEmail[0]) {
    const [linked] = await db
      .update(users)
      .set({ googleSub: profile.sub, updatedAt: new Date() })
      .where(and(eq(users.id, byEmail[0].id), isNull(users.googleSub)))
      .returning();
    return linked ?? byEmail[0];
  }

  const [created] = await db
    .insert(users)
    .values({
      email,
      name: profile.name,
      hscBatch: "",
      googleSub: profile.sub,
      passwordHash: null,
    })
    .returning();
  if (!created) throw new Error("google_user_create_failed");
  return created;
}
