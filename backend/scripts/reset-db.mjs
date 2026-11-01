import "dotenv/config";
import pg from "pg";

// Local-only hard reset: recreate the public schema, then let Drizzle rebuild it.
const client = new pg.Client({ connectionString: process.env.DATABASE_URL });
await client.connect();
await client.query("drop schema public cascade");
await client.query("drop schema if exists drizzle cascade");
await client.query("create schema public");
await client.query("grant all on schema public to postgres");
await client.query("grant all on schema public to public");
console.log("public schema recreated");
await client.end();
