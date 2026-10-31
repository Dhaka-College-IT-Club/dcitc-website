import pg from "pg";

const client = new pg.Client({
  connectionString: "postgresql://postgres:postgres@127.0.0.1:54322/postgres",
});
await client.connect();
const existing = await client.query("select 1 from pg_database where datname = 'dcitc_test'");
if (existing.rowCount === 0) {
  await client.query("CREATE DATABASE dcitc_test");
  console.log("created dcitc_test");
} else {
  console.log("dcitc_test exists");
}
await client.end();
