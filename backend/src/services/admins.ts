import { eq } from "drizzle-orm";
import { env } from "../config/env.js";
import { db } from "../db/pool.js";
import { admins, auditLog } from "../db/schema.js";
import { hashPassword, verifyPassword } from "../lib/password.js";

/** A pool handle or a transaction handle, so the audit insert can join the mutation. */
type AuditExecutor = Pick<typeof db, "insert">;

export async function writeAudit(
  entry: {
    actorAdminId: string | null;
    action: string;
    targetType?: string | null;
    targetId?: string | null;
    metadata?: Record<string, unknown>;
  },
  executor: AuditExecutor = db,
): Promise<void> {
  await executor.insert(auditLog).values({
    actorAdminId: entry.actorAdminId,
    action: entry.action,
    targetType: entry.targetType ?? null,
    targetId: entry.targetId ?? null,
    metadata: entry.metadata ?? {},
  });
}

export type SeedAccount = {
  email: string;
  password: string;
  name: string;
  role: "admin" | "super_admin";
};

/**
 * Make one env-defined account usable: create it if missing, otherwise align
 * the password, role, and active flag with the current env values. The stored
 * hash is only rewritten when the env password no longer matches, so a normal
 * boot does no hashing and keeps existing sessions alive; a changed password
 * bumps `tokenVersion` so sessions signed with the old one are revoked.
 */
export async function reconcileSeedAdmin(account: SeedAccount): Promise<void> {
  const [existing] = await db
    .select()
    .from(admins)
    .where(eq(admins.email, account.email))
    .limit(1);

  if (!existing) {
    await db
      .insert(admins)
      .values({
        email: account.email,
        name: account.name,
        passwordHash: await hashPassword(account.password),
        role: account.role,
      })
      .onConflictDoNothing();
    return;
  }

  const patch: Partial<typeof admins.$inferInsert> = {};
  if (!(await verifyPassword(account.password, existing.passwordHash))) {
    patch.passwordHash = await hashPassword(account.password);
    patch.tokenVersion = existing.tokenVersion + 1;
  }
  if (existing.role !== account.role) patch.role = account.role;
  if (!existing.active) patch.active = true;
  if (Object.keys(patch).length === 0) return;

  await db
    .update(admins)
    .set({ ...patch, updatedAt: new Date() })
    .where(eq(admins.id, existing.id));
}

/**
 * Env-seeded accounts are authoritative on every boot, so editing `.env` (then
 * restarting) is enough to change or recover a login: a missing account is
 * recreated, and an existing one gets the current password, role, and active
 * flag. Renaming or deleting these accounts in the dashboard is therefore
 * temporary; edit `.env` to change them for good.
 */
export async function seedAdmins(): Promise<void> {
  await reconcileSeedAdmin({
    email: env.SUPER_ADMIN_EMAIL,
    password: env.SUPER_ADMIN_PASSWORD,
    name: "Super Admin",
    role: "super_admin",
  });

  if (env.ADMIN_EMAIL && env.ADMIN_PASSWORD) {
    await reconcileSeedAdmin({
      email: env.ADMIN_EMAIL,
      password: env.ADMIN_PASSWORD,
      name: "Admin",
      role: "admin",
    });
  }
}
