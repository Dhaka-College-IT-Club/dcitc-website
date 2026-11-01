import { pathToFileURL } from "node:url";
import { fileURLToPath } from "node:url";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { db, pool } from "./pool.js";

const migrationsFolder = fileURLToPath(new URL("../../drizzle", import.meta.url));

export async function runMigrations(): Promise<void> {
  await migrate(db, { migrationsFolder });
}

const invokedDirectly = process.argv[1]
  ? pathToFileURL(process.argv[1]).href === import.meta.url
  : false;

/** Host only, never credentials; so a failed deploy log says which database it tried. */
function databaseHost(): string | undefined {
  try {
    return process.env.DATABASE_URL ? new URL(process.env.DATABASE_URL).host : undefined;
  } catch {
    return "unparseable DATABASE_URL";
  }
}

if (invokedDirectly) {
  try {
    await runMigrations();
  } catch (error) {
    // Drizzle wraps driver errors, so the useful part (ENOTFOUND, 28P01, TLS failure)
    // is on `cause`, not on the message.
    const cause = (error as { cause?: unknown }).cause;
    console.error(
      JSON.stringify({
        level: "error",
        message: "migrations_failed",
        detail: (error as Error).message,
        host: databaseHost(),
        cause:
          cause instanceof Error
            ? `${(cause as NodeJS.ErrnoException).code ?? cause.name}: ${cause.message}`
            : undefined,
      }),
    );
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}
