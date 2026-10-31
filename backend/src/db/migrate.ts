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

if (invokedDirectly) {
  try {
    await runMigrations();
  } catch (error) {
    console.error(
      JSON.stringify({ level: "error", message: "migrations_failed", detail: (error as Error).message }),
    );
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}
