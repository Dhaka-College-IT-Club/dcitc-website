import { pool } from "../src/db/pool.js";

/**
 * Local-only: create the read-only role used by the MCP inspectors.
 * Credentials are deliberately non-secret and only exist on a local stack.
 */
const ROLE = "dcitc_readonly";
const PASSWORD = "dcitc_readonly";

const { rows } = await pool.query<{ name: string }>("select current_database() as name");
const database = rows[0]!.name;

const statements = [
  `DO $$ BEGIN
     IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = '${ROLE}') THEN
       CREATE ROLE ${ROLE} LOGIN PASSWORD '${PASSWORD}';
     ELSE
       ALTER ROLE ${ROLE} WITH LOGIN PASSWORD '${PASSWORD}';
     END IF;
   END $$;`,
  `GRANT CONNECT ON DATABASE "${database}" TO ${ROLE}`,
  `GRANT USAGE ON SCHEMA public TO ${ROLE}`,
  `GRANT SELECT ON ALL TABLES IN SCHEMA public TO ${ROLE}`,
  `ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON TABLES TO ${ROLE}`,
  // RLS is enabled on every table; this policy lets the local inspector read.
  `DO $$ DECLARE t record;
   BEGIN
     FOR t IN SELECT tablename FROM pg_tables WHERE schemaname = 'public' LOOP
       IF NOT EXISTS (
         SELECT 1 FROM pg_policies
         WHERE schemaname = 'public' AND tablename = t.tablename AND policyname = 'readonly_select'
       ) THEN
         EXECUTE format('CREATE POLICY readonly_select ON public.%I FOR SELECT TO ${ROLE} USING (true)', t.tablename);
       END IF;
     END LOOP;
   END $$;`,
];

try {
  for (const statement of statements) await pool.query(statement);
  console.log(JSON.stringify({ level: "info", message: "readonly_role_ready", role: ROLE }));
} finally {
  await pool.end();
}
