import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import { env } from "../config/env.js";
import * as schema from "./schema.js";

const isLocal = /(^|@)(localhost|127\.0\.0\.1|::1)[:/]/.test(env.DATABASE_URL);

export function createPool(connectionString: string): pg.Pool {
  return new pg.Pool({
    connectionString,
    max: 10,
    ssl: isLocal ? false : { rejectUnauthorized: false },
  });
}

export const pool = createPool(env.DATABASE_URL);
export const db = drizzle(pool, { schema });

export type Database = typeof db;

export async function ping(): Promise<boolean> {
  try {
    await pool.query("select 1");
    return true;
  } catch {
    return false;
  }
}
