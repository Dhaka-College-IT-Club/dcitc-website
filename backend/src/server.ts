import { env } from "./config/env.js";
import { createApp } from "./app.js";
import { pool } from "./db/pool.js";
import { runMigrations } from "./db/migrate.js";
import { seedAdmins } from "./services/admins.js";

const app = createApp();

async function boot(): Promise<void> {
  try {
    await pool.query("select 1");
  } catch (error) {
    console.error(
      JSON.stringify({ level: "error", message: "database_unreachable", detail: (error as Error).message }),
    );
    process.exit(1);
  }

  if (env.RUN_MIGRATIONS) await runMigrations();
  await seedAdmins();

  const server = app.listen(env.PORT, () => {
    console.log(`The server is running on port ${env.PORT}`);
  });

  const shutdown = (signal: string) => {
    console.log(JSON.stringify({ level: "info", message: "shutting_down", signal }));
    server.close(async () => {
      await pool.end();
      process.exit(0);
    });
    setTimeout(() => process.exit(0), 10_000).unref();
  };

  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT", () => shutdown("SIGINT"));
}

void boot();
