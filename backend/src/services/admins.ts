import { eq } from "drizzle-orm";
import { env } from "../config/env.js";
import { db } from "../db/pool.js";
import { admins, auditLog } from "../db/schema.js";
import { hashPassword } from "../lib/password.js";

export async function writeAudit(entry: {
  actorAdminId: string | null;
  action: string;
  targetType?: string | null;
  targetId?: string | null;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  await db.insert(auditLog).values({
    actorAdminId: entry.actorAdminId,
    action: entry.action,
    targetType: entry.targetType ?? null,
    targetId: entry.targetId ?? null,
    metadata: entry.metadata ?? {},
  });
}

/**
 * Create the env-seeded operators when their emails are absent.
 * Never updates an existing row, so a restart cannot reset a password.
 */
export async function seedAdmins(): Promise<void> {
  const seeded: Array<{ email: string; password: string; role: "super_admin" | "admin" }> = [
    { email: env.SUPER_ADMIN_EMAIL, password: env.SUPER_ADMIN_PASSWORD, role: "super_admin" },
  ];
  if (env.ADMIN_EMAIL && env.ADMIN_PASSWORD) {
    seeded.push({ email: env.ADMIN_EMAIL, password: env.ADMIN_PASSWORD, role: "admin" });
  }

  for (const account of seeded) {
    const existing = await db
      .select({ id: admins.id })
      .from(admins)
      .where(eq(admins.email, account.email))
      .limit(1);
    if (existing.length > 0) continue;

    await db
      .insert(admins)
      .values({
        email: account.email,
        name: account.role === "super_admin" ? "Super Admin" : "Admin",
        passwordHash: await hashPassword(account.password),
        role: account.role,
      })
      .onConflictDoNothing();
  }
}
