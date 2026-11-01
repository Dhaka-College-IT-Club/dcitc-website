import { pool } from "../src/db/pool.js";
import { seedContent, seedReport } from "../src/db/seed.js";

try {
  await seedContent();
  console.log(JSON.stringify({ level: "info", message: "seed_complete", ...(await seedReport()) }));
} catch (error) {
  console.error(JSON.stringify({ level: "error", message: "seed_failed", detail: (error as Error).message }));
  process.exitCode = 1;
} finally {
  await pool.end();
}
