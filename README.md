# DCITC Platform

The official website of the **Dhaka College Information & Technology Club (DCITC)** — a public club site, member accounts, and an admin content console.

## Overview

The repository is a two-part monorepo. `frontend/` serves the public site (departments, leadership, achievements, intel, contact) and the authenticated areas (member dashboard and admin console). `backend/` is a standalone Express API that owns authentication, content, uploads, and mail, backed by PostgreSQL with Drizzle ORM.

Public pages are rendered on the server and pull content from the API; the landing page and archive pages revalidate every 60 seconds, so admin edits appear without a redeploy.

## Features

### Public site

- Landing page with hero, mission, the six club departments, leadership panel, featured achievements, and the latest intel.
- Achievements archive at `/achievements`.
- Intel archive at `/intel` with article pages at `/intel/[slug]`.
- Contact form with a honeypot field and per-IP rate limiting; submissions are emailed to the club.
- Server rendering with 60-second incremental revalidation (ISR) on the landing page, achievements, and intel archives.

### Member features

- Signup in three steps: request a 6-digit email OTP, verify it, then set name, HSC batch, and password.
- Email/password login and logout using an httpOnly JWT cookie (7 days).
- Google sign-in for accounts with a verified Google email; existing password accounts are linked by email.
- Password reset with an emailed OTP; account email recovery by name and HSC batch.
- Member dashboard showing account details and the membership card, with the annual price and membership form URL managed by admins.

### Admin features

- Leadership CRUD: name, role, tier (executive / chief / joint), batch, image, social links, and sort order.
- Achievements CRUD with a gallery and five featured slots (reordering content on the landing page).
- Intel CRUD: slug, title, excerpt, content, tag, author, date, image, and three featured slots.
- Image uploads through signed Supabase Storage URLs (JPEG, PNG, WebP; 5 MiB limit).
- Settings management for the membership form URL and price.
- Content and settings changes are recorded in the audit log.

### Super Admin features

- Create, edit, deactivate, and reactivate admin accounts, and rotate their passwords.
- View the audit log of admin activity.
- Guards prevent self-deactivation and deactivating the last active super admin; deactivation and password rotation invalidate existing sessions immediately.

## Tech stack

Versions reflect the `package.json` files in this repository.

### Frontend

| Package | Version |
|---|---|
| Next.js | ^16.4.3 (App Router, React Compiler enabled) |
| React / React DOM | 19.2.0 |
| TypeScript | ^5 |
| Tailwind CSS | ^4 (`@tailwindcss/postcss` ^4.1.17) |
| Framer Motion | ^12.23.24 |
| Lucide React | ^0.555.0 |
| ESLint | ^9 (`eslint-config-next` 16.0.4) |

### Backend

| Package | Version |
|---|---|
| Node.js | >= 22 |
| Express | ^5.1.0 |
| TypeScript | ^5.9.0 (`tsx` ^4.20.0 for dev) |
| Drizzle ORM | ^0.45.4 (`drizzle-kit` ^0.31.0) |
| PostgreSQL driver (`pg`) | ^8.16.0 |
| Zod | ^4.6.7 |
| JWT | `jose` ^6.1.0, `jsonwebtoken` ^9.0.2 |
| Mail | Nodemailer ^10.3.1 |
| Supabase client | `@supabase/supabase-js` ^2.58.0 |
| Hardening | Helmet ^8.1.0, `express-rate-limit` ^8.0.0, compression ^1.8.0 |

### Database

- PostgreSQL, with the schema and queries defined in `backend/src/db/schema.ts`.
- Local development runs the Supabase CLI stack (Postgres and Storage) in Docker; see `backend/supabase/config.toml`.
- Tables: `users`, `admins`, `otp_codes`, `leadership`, `achievements`, `intels`, `settings`, `audit_log`.
- Drizzle-generated SQL migrations live in `backend/drizzle/`; custom SQL covers what Drizzle does not express (`citext`, the `updated_at` trigger, RLS enablement).

### Infrastructure and hosting

- Frontend: Next.js on Vercel (`frontend/vercel.json`, project root directory `frontend/`).
- Backend: a long-lived Node service on Render or Railway (`backend/render.yaml` defines a Render web service).
- Database and storage: Supabase, locally through the CLI stack.
- Same-origin API: Next.js rewrites `/api/v1/*` to the API origin, so cookies are first-party and there is no CORS.

## Project structure

```
dcitc-website/
├── frontend/                    Next.js app
│   ├── src/app/                 route groups: (site), (auth), (member), admin
│   ├── src/components/          landing, auth, dashboard, admin, and UI components
│   ├── src/lib/                 API client and shared types
│   ├── next.config.ts           API rewrite, image hosts, admin redirects
│   ├── vercel.json
│   └── .env.example
├── backend/                     Express + TypeScript API
│   ├── src/
│   │   ├── routes/              public, auth, admin, superAdmin, contact
│   │   ├── db/                  Drizzle schema, migration runner, seed
│   │   ├── mail/                transactional email
│   │   ├── uploads/             signed Supabase Storage uploads
│   │   ├── middleware/          auth, validation, rate limiting
│   │   └── config/, lib/, services/
│   ├── drizzle/                 SQL migrations
│   ├── scripts/                 local database, test database, storage setup
│   ├── test/                    unit and integration tests
│   ├── supabase/                local Supabase CLI configuration only
│   ├── render.yaml
│   └── .env.example
├── docs/
│   └── api-contract.md          full HTTP API reference
├── DEPLOY_CHECKLIST.md          production checks for the API and Supabase project
└── openspec/                    local planning artifacts (gitignored, not part of the build)
```

## Getting started

### Requirements

- Node.js 22 or newer.
- Docker Desktop, for the local Supabase stack.
- The Supabase CLI is installed as a backend dev dependency, so the `db:*` scripts below work without a global install.

There is no root `package.json`; install and run each app from its own folder.

### 1. Backend and database

```bash
cd backend
npm install
cp .env.example .env        # then fill the values
npm run db:start            # local Postgres on 127.0.0.1:54322, Storage on 127.0.0.1:54321
npm run db:migrate          # apply the Drizzle migrations
npm run db:roles            # create the local read-only role used by MCP inspectors
npm run db:seed             # demo leadership, achievements, intels, and settings
npm run storage:setup       # create the public-read "uploads" bucket
npm run dev                 # http://localhost:4000
```

`npm run dev` also applies pending migrations (`RUN_MIGRATIONS=true`) and seeds a super admin from `SUPER_ADMIN_EMAIL` / `SUPER_ADMIN_PASSWORD` while no super admin exists. Other admin accounts are created from the dashboard.

Local mail uses `MAIL_TRANSPORT=log`, so OTP codes and contact notifications print to the console instead of being sent.

Useful database scripts:

| Script | Purpose |
|---|---|
| `npm run db:status` / `db:stop` | Inspect or stop the Supabase stack |
| `npm run db:generate` | Generate SQL migrations from the Drizzle schema |
| `npm run db:reset` | Drop, migrate, create roles, and reseed |
| `npm run db:test` | Create the `dcitc_test` database used by tests |

### 2. Frontend

```bash
cd frontend
cp .env.example .env.local
npm ci
npm run dev                 # http://localhost:3000
```

Set `API_ORIGIN` to the running API (`http://localhost:4000` by default). `IMAGE_REMOTE_HOSTS` is a comma-separated list of image hostnames allowed by `next/image`; add the Supabase Storage host when uploads are served from it.

### 3. Checks

```bash
cd frontend
npm run lint
npm run build

cd ../backend
npm run lint                # type-check
npm run db:test
npm test                    # unit and integration tests against the local stack
```

The complete HTTP API — envelopes, cookies, routes, rate limits, and status codes — is documented in [`docs/api-contract.md`](docs/api-contract.md).

## Environment variables

Each app documents its variables in its own `.env.example`:

- `frontend/.env.example` — API origin and allowed image hosts.
- `backend/.env.example` — database URLs, JWT and OTP secrets, seeded super admin credentials, SMTP settings, Google OAuth credentials, and Supabase Storage settings.

Copy the example file and fill in the values. Never commit real secrets.

## Deployment

The intended topology is a Vercel frontend, a Render or Railway API service, and a hosted Supabase project for Postgres and Storage. **No production deployment is recorded in this repository**, so treat the hosted setup as planned rather than live.

- `backend/render.yaml` defines the API web service, its build and start commands, health check, and environment variables.
- `frontend/vercel.json` sets the Next.js framework, with the Vercel project root directory set to `frontend/`.
- The frontend reaches the API through the `/api/v1/*` rewrite, so `API_ORIGIN` must point at the deployed API.
- [`DEPLOY_CHECKLIST.md`](DEPLOY_CHECKLIST.md) covers the production-specific checks: storage bucket limits, proxy hop count, database TLS, admin seeding, and secret rotation.

Hosted database and storage access, the Google OAuth redirect URI, and SMTP deliverability must be configured per environment before launch.

## Contributing

This is a club project, and DCITC members are welcome to contribute.

1. Read [`docs/api-contract.md`](docs/api-contract.md) and [`backend/README.md`](backend/README.md) before changing code.
2. Branch from the current development branch; do not commit directly to `main`.
3. Keep the API contract in `docs/api-contract.md` in sync with any endpoint change.
4. Run the checks above before opening a pull request, and describe what you changed and why.

For anything larger than a small fix, open an issue or talk to the web development team first.
