import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import { env } from "../config/env.js";
import * as schema from "./schema.js";
import { sslConfig } from "./ssl.js";

export function createPool(connectionString: string): pg.Pool {
  return new pg.Pool({
    connectionString,
    max: 10,
    ssl: sslConfig(connectionString, env.NODE_ENV, env.DB_SSL_CA),
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
