# DCITC Platform — Version 2.0 Relaunch Guide

Analysis-only document. No code changes have been made. Use this as the input for `/opsx propose`.

## 0. Snapshot of current state

- Frontend `package.json` version: `2.0.0` (already bumped).
- Backend `package.json` version: `1.0.0` (still v1 — needs bump).
- No root `package.json` (monorepo has no workspace root manifest).
- No `CHANGELOG.md` exists at repo root or in either app.
- No git tags exist (`git tag` returns nothing). Current branch: `dev/samiul`.
- API is mounted under `/api/v1/*` everywhere (backend `src/app.ts`, frontend rewrite + `lib/api.ts`, `GoogleButton.tsx`, docs, tests, render.yaml).
- No user-facing "version" string anywhere in the UI.

---

## 1. Repository versioning strategy

### 1.1 Tag the current (v1) state before migrating
Because there are no tags today, create a reference point for "before":
- `git tag -a v1.0.0 <current HEAD> -m "DCITC platform v1.0.0 (pre-2.0 baseline)"` on the last pre-migration commit.
- Optionally create an archive branch `archive/v1` pointing at the same commit, so v1 stays browsable without relying on tags.
- Then do all v2 work on `dev/samiul` (or a new `feature/v2-relaunch`), never on `main`.

### 1.2 Version manifests
- `frontend/package.json` — already `"version": "2.0.0"`. Keep; bump patch on fixes (`2.0.1`).
- `backend/package.json` — change `"version": "1.0.0"` → `"2.0.0"`.
- No root manifest; if you later add a workspace root, set its version to `2.0.0` too.
- Use SemVer going forward: `2.x.y`. Breaking API changes → `3.0.0` + `/api/v3`.

### 1.3 CHANGELOG.md
Create `CHANGELOG.md` at repo root (keep-a-changelog format). Seed it with a `## [2.0.0] - <date>` section summarizing the relaunch (auth, content, admin console, API versioning). Add a `## [Unreleased]` section above it. Optional: per-app `frontend/CHANGELOG.md` / `backend/CHANGELOG.md` if you want app-scoped notes; root-level is enough for a monorepo this size.

### 1.4 README / docs "Version 2.0" signal
- `README.md` (root): add a badge line under the H1, e.g. `![Version](https://img.shields.io/badge/version-2.0.0-blue)` and a short "What's new in 2.0" bullet list. Update the `/api/v1/*` references (lines 87, 196) to `/api/v2/*`.
- `backend/README.md`: update curl examples (lines 68, 73, 76) to `/api/v2`.
- `docs/api-contract.md`: title `# DCITC API contract (/api/v2)`; update base URL and all example URLs.
- `DEPLOY_CHECKLIST.md`: line 46 `/api/v1/health` → `/api/v2/health`.

### 1.5 Git tag / GitHub Release
- After merging v2 to `main`: `git tag -a v2.0.0 -m "DCITC Platform v2.0.0"` and push the tag.
- Create a GitHub Release from that tag with the CHANGELOG section as release notes.
- Release branch is optional for a clean relaunch; skip unless you need to hotfix v1 in parallel (you don't — v1 was never deployed as a product).

---

## 2. API versioning: `/api/v1` → `/api/v2`

### 2.1 Backend route mounting (`backend/src/app.ts`)
Lines 34–45 mount every router under `/api/v1`. Change all to `/api/v2`:
- `app.get("/api/v2/health", …)` (line 34)
- `app.use("/api/v2/auth", authRouter)` (41)
- `app.use("/api/v2/admin", adminRouter)` (42)
- `app.use("/api/v2/super-admin", superAdminRouter)` (43)
- `app.use("/api/v2", publicRouter)` (44)
- `app.use("/api/v2", contactRouter)` (45)
No changes needed inside the route files themselves — they define relative paths.

### 2.2 Backend env default redirect URI (`backend/src/config/env.ts`)
Line 102: `env.GOOGLE_REDIRECT_URI ?? ${env.FRONTEND_URL}/api/v1/auth/google/callback`
→ `/api/v2/auth/google/callback`. This is the fallback used when `GOOGLE_REDIRECT_URI` is not set, so it must match the new mount or Google OAuth breaks.

### 2.3 Frontend rewrite (`frontend/next.config.ts`)
Lines 49–50:
```
source: "/api/v2/:path*",
destination: `${process.env.API_ORIGIN ?? "http://localhost:4000"}/api/v2/:path*`,
```

### 2.4 Frontend API client (`frontend/src/lib/api.ts`)
- Line 28: `fetch(`/api/v2${path}`, …)`
- Line 53: `fetch(`${origin}/api/v2${path}`, …)`

### 2.5 Google sign-in button (`frontend/src/components/ui/GoogleButton.tsx`)
Line 3: `href = "/api/v2/auth/google/start"`.

### 2.6 Render health check (`backend/render.yaml`)
Line 10: `healthCheckPath: /api/v2/health`.

### 2.7 Tests (must track the new prefix or they break)
- `backend/test/auth.test.ts` — every `/api/v1/…` string (~70 occurrences). Includes the OAuth callback assertion at line 302 (`redirect_uri` ends with `/api/v2/auth/google/callback`).
- `backend/test/content.test.ts` — every `/api/v1/…` string.
- `backend/test/unit.test.ts`, `helpers.ts`, `setup.ts` — grep for `/api/v1` (none currently, but verify).
These are test code; update them mechanically as part of the same change so the suite stays green. Do not weaken assertions.

### 2.8 Compiled output
`backend/dist/` contains stale `/api/v1` strings (build artifacts). Regenerate with `npm run build` after editing; do not hand-edit. Consider adding `dist/` to `.gitignore` if it isn't already, to avoid stale diffs.

### 2.9 Risk areas / external callbacks
- **Google OAuth redirect URI** is the main risk. The value registered in Google Cloud Console must exactly equal `GOOGLE_REDIRECT_URI` (or the new default `${FRONTEND_URL}/api/v2/auth/google/callback`). Update the Console entry when deploying; mismatches cause `redirect_uri_mismatch`. Both the registered URI and the backend default must change together.
- **Supabase Storage** URLs are unrelated to the API prefix (they live under `/storage/v1/object/public/…` on the Supabase host) — do not touch those.
- **No webhooks** exist in this codebase (no Stripe/payment provider, no third-party callbacks). Confirm before launch, but nothing to migrate.
- **CORS**: none configured — traffic is same-origin via the Next rewrite, so no CORS origin list needs updating. If you later call the API cross-origin, revisit.
- **Cookies**: `Path=/` on `dcitc_at`/`dcitc_admin`/`dcitc_oauth_state`, so the prefix change doesn't affect cookies.
- **Rate limiters / IP logging**: unaffected (path-agnostic).
- **Frontend `API_ORIGIN` env var**: unchanged; only the path suffix changes. No env rename needed, but document the new prefix in `frontend/.env.example` comments if any.

### 2.10 Historical specs (optional)
`openspec/changes/backend-express-api/…` and `frontend-auth-dashboards/…` reference `/api/v1` in specs/tasks. These are archived change records — leave them as historical truth, or update only if you want consistency. Not required for runtime.

---

## 3. Frontend/product-facing version signal

Keep it subtle and out of the main UI flow:
- **Footer** (`frontend/src/components/Footer.tsx`): add a muted line in the bottom bar, e.g. `v2.0.0` next to the copyright, styled like the existing `text-slate-600 text-[10px]` line. This is the natural, non-awkward spot.
- **Admin settings page** (`frontend/src/app/admin/settings/page.tsx`): add a small "Build / Version" read-only row in the aside (or a new card) showing `v2.0.0` and the git commit SHA if you inject it at build time. Useful for support/debugging.
- **About / metadata**: optional `frontend/src/app/layout.tsx` metadata description could mention "v2" but probably skip — keep marketing copy clean.
- **Avoid** putting a version badge in the navbar or hero; it looks like a beta tag.

Implementation note: hardcode `2.0.0` in a single constant (e.g. add `VERSION` to `CLUB` in `constants.ts` or a new `frontend/src/lib/version.ts`) so the footer and settings page share one source. Optionally inject `NEXT_PUBLIC_GIT_SHA` via Vercel build env for the admin panel.

---

## 4. Deployment / rollout

This is a clean relaunch — no legacy v1 traffic exists (README states "No production deployment is recorded in this repository"). Therefore:
- No migration script, no redirect from `/api/v1` to `/api/v2`, no blue/green cutover needed.
- Fresh Vercel (frontend) + Render/Railway (backend) + Supabase (DB/storage) projects.
- Before first deploy: set `GOOGLE_REDIRECT_URI` to the production value (`https://<frontend>/api/v2/auth/google/callback`) and register that exact URI in Google Console. Update `render.yaml` health check path (done in 2.6).
- Run `npm run db:migrate` + `npm run db:seed` + `npm run storage:setup` on the new Supabase project.
- Rotate all secrets (per `DEPLOY_CHECKLIST.md` §5) for the new environment.
- Optional safety: keep the backend returning `404` (notFoundHandler) for any stray `/api/v1/*` request so old cached clients fail loudly rather than silently. No redirect.

---

## 5. Step-by-step checklist (ordered)

### Phase A — Git baseline (before code changes)
1. `git tag -a v1.0.0 HEAD -m "DCITC platform v1.0.0 baseline"` (and push tag).
2. `git checkout -b feature/v2-relaunch` from `dev/samiul`.

### Phase B — API prefix migration (backend)
3. Edit `backend/src/app.ts` (lines 34, 41–45): `/api/v1` → `/api/v2`.
4. Edit `backend/src/config/env.ts` (line 102): `/api/v1/auth/google/callback` → `/api/v2/auth/google/callback`.
5. Edit `backend/render.yaml` (line 10): health check path.
6. Edit `backend/package.json`: version `1.0.0` → `2.0.0`.
7. Edit `backend/README.md` (lines 68, 73, 76): curl examples.
8. Update tests: `backend/test/auth.test.ts`, `backend/test/content.test.ts` — replace all `/api/v1` with `/api/v2` (mechanical). Verify `unit.test.ts`/`helpers.ts`/`setup.ts` have none.
9. Rebuild: `npm run build` in `backend/` to refresh `dist/`.

### Phase C — Frontend
10. Edit `frontend/next.config.ts` (lines 49–50): rewrite paths.
11. Edit `frontend/src/lib/api.ts` (lines 28, 53): fetch paths.
12. Edit `frontend/src/components/ui/GoogleButton.tsx` (line 3): href.
13. `frontend/package.json` already `2.0.0` — verify, no change.
14. (Optional) Add `VERSION` to `frontend/src/constants.ts` (`CLUB.VERSION = "2.0.0"`) and render in Footer + admin settings.

### Phase D — Docs
15. Create `CHANGELOG.md` at repo root.
16. Edit `README.md`: badge + "What's new in 2.0" + `/api/v1` → `/api/v2` (lines 87, 196).
17. Edit `docs/api-contract.md`: title + base URL + example URLs.
18. Edit `DEPLOY_CHECKLIST.md` (line 46): health check example.

### Phase E — Version signal in UI (optional, recommended)
19. Edit `frontend/src/components/Footer.tsx`: add `v2.0.0` to bottom bar.
20. Edit `frontend/src/app/admin/settings/page.tsx`: add read-only version row.

### Phase F — Verify
21. `cd frontend && npm run lint && npm run build`.
22. `cd backend && npm run lint && npm run db:test && npm test`.
23. Manual smoke: signup/login, Google start redirect URI ends with `/api/v2/auth/google/callback`, admin CRUD, public pages.
24. Grep the repo (excluding `node_modules`, `.next`, `dist`, `.playwright-mcp`) for `/api/v1` — only historical openspec specs should remain.

### Phase G — Release
25. Merge `feature/v2-relaunch` → `main` (via PR).
26. `git tag -a v2.0.0` on the merge commit, push tag.
27. Create GitHub Release with CHANGELOG section.
28. Deploy frontend to Vercel, backend to Render/Railway against new Supabase project; set `GOOGLE_REDIRECT_URI` and register it in Google Console.
29. Run migrations/seed/storage setup on the new Supabase project.

---

## 6. Out of scope / decisions deferred
- No redirect shim from `/api/v1` to `/api/v2` (clean relaunch; nothing deployed).
- No API deprecation headers (first versioned release).
- Historical openspec change records left untouched.
- Version string in UI is optional (Phase E) — decide during review.