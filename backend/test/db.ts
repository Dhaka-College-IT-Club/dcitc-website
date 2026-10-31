import { fileURLToPath } from "node:url";
import { sql } from "drizzle-orm";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { db, pool } from "../src/db/pool.js";
import { seedContent } from "../src/db/seed.js";
import { seedAdmins } from "../src/services/admins.js";

const migrationsFolder = fileURLToPath(new URL("../drizzle", import.meta.url));

export const hasTestDb = Boolean(process.env.TEST_DATABASE_URL);

let prepared: Promise<void> | null = null;

export function prepareDatabase(): Promise<void> {
  prepared ??= (async () => {
    if (!hasTestDb) return;
    await migrate(db, { migrationsFolder });
    await db.execute(
      sql`truncate table audit_log, otp_codes, users, achievements, intels, leadership, settings, admins restart identity cascade`,
    );
    await seedAdmins();
    await seedContent();
  })();
  return prepared;
}

/** Let a new OTP request through the 60s cooldown without sleeping. */
export async function ageRecentOtp(email: string): Promise<void> {
  await pool.query("update otp_codes set created_at = created_at - interval '61 seconds' where email = $1", [
    email.toLowerCase(),
  ]);
}

export async function closePool(): Promise<void> {
  if (process.env.TEST_DATABASE_URL) await pool.end();
}
