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
 * Create the env-seeded super admin on the first boot only.
 * Never updates an existing row, so a restart cannot reset a password. It keys
 * off "a super admin already exists" rather than the seeded email so renaming
 * that account cannot resurrect it with the env password. Other admins are
 * created from the dashboard by a super admin.
 */
export async function seedAdmins(): Promise<void> {
  const existing = await db
    .select({ id: admins.id })
    .from(admins)
    .where(eq(admins.role, "super_admin"))
    .limit(1);
  if (existing.length > 0) return;

  await db
    .insert(admins)
    .values({
      email: env.SUPER_ADMIN_EMAIL,
      name: "Super Admin",
      passwordHash: await hashPassword(env.SUPER_ADMIN_PASSWORD),
      role: "super_admin",
    })
    .onConflictDoNothing();
}
