# DCITC API

Express 5 + TypeScript service for the DCITC website. Owns auth, content, uploads, and mail.
Postgres schema and queries are defined with Drizzle ORM; the local runtime is a Supabase CLI stack.

## Requirements

- Node 22+
- Docker Desktop (for the local Supabase stack)

## Setup

```bash
cd backend
npm install
cp .env.example .env    # then fill the values
npm run db:start        # starts local Postgres on 127.0.0.1:54322 and Storage on 127.0.0.1:54321
npm run db:migrate      # applies drizzle/*.sql
npm run db:roles        # creates the local read-only role used by MCP inspectors
npm run db:seed         # 36 leadership rows, 6 achievements, 6 intels, 2 settings
npm run storage:setup   # creates the public-read `uploads` bucket
npm run dev             # http://localhost:4000
```

`npm run dev` also runs pending migrations (`RUN_MIGRATIONS=true`) and, while no super admin
exists yet, seeds one from `SUPER_ADMIN_EMAIL` / `SUPER_ADMIN_PASSWORD`. An existing super
admin is never overwritten or re-created. Other admin accounts are created in the dashboard by
a super admin.

Local mail uses `MAIL_TRANSPORT=log`: messages (including OTP codes) print to the console.
`log` is refused when `NODE_ENV=production`.

## Scripts

| Script | What it does |
|---|---|
| `npm run dev` | watch mode on port 4000 |
| `npm run build` / `npm start` | compile to `dist/` / run the build |
| `npm run lint` | type-check every TS file in the repo folder |
| `npm test` | unit + integration tests (needs the local stack) |
| `npm run db:start` / `db:stop` / `db:status` | Supabase CLI stack |
| `npm run db:generate` | generate `drizzle/` SQL from `src/db/schema.ts` |
| `npm run db:migrate` | apply pending migrations |
| `npm run db:seed` | idempotent demo content + settings |
| `npm run db:reset` | drop, migrate, roles, seed |
| `npm run db:test` | create the `dcitc_test` database used by tests |
| `npm run storage:setup` | create the `uploads` bucket |

## Tests

```bash
npm run db:test
npm test
```

Tests use `TEST_DATABASE_URL` (from `.env`) and truncate that database before each suite.
They never touch the development database. Rate limiters are disabled during tests except in
the limiter suite.

## Super admin

The first super admin comes from `SUPER_ADMIN_EMAIL` / `SUPER_ADMIN_PASSWORD` on boot.

```bash
# log in (sets the dcitc_admin cookie)
curl -s -c admin.jar -H "content-type: application/json" \
  -d '{"email":"super@dcitc.local","password":"SuperAdmin123!"}' \
  http://localhost:4000/api/v1/admin/auth/login

# create a standard admin
curl -s -b admin.jar -H "content-type: application/json" \
  -d '{"email":"ops@example.com","name":"Ops","password":"OpsPass123!","role":"admin"}' \
  http://localhost:4000/api/v1/super-admin/admins

# read the audit log
curl -s -b admin.jar "http://localhost:4000/api/v1/super-admin/audit-log?limit=20"
```

Rotation and deactivation bump `token_version`, so every previous cookie for that admin
returns 401 immediately.

## Database notes

- Drizzle is the only source of schema. `drizzle-kit generate` writes `drizzle/*.sql`; the
  custom migrations hold what Drizzle cannot express (`citext`, the `updated_at` trigger,
  RLS enablement).
- RLS is enabled on every table with no policies for `anon`; only the API's own role (and the
  local `dcitc_readonly` inspector) can read.
- `supabase/` only configures the local runtime. It contains no schema migrations; keep
  `supabase/migrations` empty.

## MCP inspectors

Both are local-only and read-only: `postgresql` (DBHub with a `readonly` tool config) and
`supabase-local` (`http://127.0.0.1:54321/mcp?read_only=true`). They connect as
`dcitc_readonly` / the Supabase read-only user, never as the owning role.
