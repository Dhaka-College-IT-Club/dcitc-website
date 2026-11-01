# DCITC API contract (`/api/v2`)

Base URL (local): `http://localhost:4000`

## Envelope

Success: `{ "data": {} }`
Error (status ≥ 400): `{ "error": { "code": "...", "message": "...", "fields": {} } }`

Error codes: `validation_failed`, `unauthenticated`, `forbidden`, `not_found`, `invalid_credentials`, `email_taken`, `slug_taken`, `slot_taken`, `invalid_otp`, `otp_expired`, `otp_exhausted`, `rate_limited`, `delivery_failed`, `cannot_modify_self`, `last_super_admin`, `internal_error`, `payload_too_large`

Rate-limited → `429` + `Retry-After`. Body cap: 128 KB → `413`.

## Cookies

| Cookie | Set by | Lifetime | Flags |
|---|---|---|---|
| `dcitc_at` | user login/signup/Google callback | 7d | `HttpOnly; SameSite=Lax; Path=/; Secure` (prod) |
| `dcitc_admin` | admin login | 7d | same |
| `dcitc_oauth_state` | `GET /auth/google/start` | 5m | same |

No CORS — cookies are first-party via Next rewrite.

## Resource shapes

```ts
User        { id: uuid, email, name, hscBatch, createdAt }
Admin       { id: uuid, email, name, role: "admin"|"super_admin", active, lastLoginAt, createdAt }
Achievement { id: number, title, detail, year, image, gallery: string[], featuredSlot: number|null, createdAt, updatedAt }
Intel       { id: number, slug, title, excerpt, content, tag, author, date, image, featuredSlot: number|null, createdAt, updatedAt }
Leader      { id: number, name, role, tier: "executive"|"chief"|"joint", batch, image, facebook, linkedin, github, portfolio, sortOrder }
AuditEntry  { id: number, actorAdminId: string|null, action, targetType, targetId, metadata, createdAt }
Settings    { membershipFormUrl: string|null, membershipPriceBdt: number }
```

`image` required on Achievement/Intel/Leader. Optional links & `featuredSlot` = `null` when unset.

## Public

| Method | Path | Notes | Success |
|---|---|---|---|
| GET | `/health` | — | `200 { status, database }`, `503` if DB down |
| GET | `/achievements` | `year` desc, cap 200. `?featured=true` → slot order, max 5 | `200 Achievement[]` |
| GET | `/achievements/:id` | — | `200 Achievement` / `404` |
| GET | `/intels` | newest first, cap 200. `?featured=true` → slot order, max 3 | `200 Intel[]` |
| GET | `/intels/:slug` | exact lowercase match | `200 Intel` / `404` |
| GET | `/leadership` | batch desc, tier, sortOrder. `?batch=` filter | `200 Leader[]` |
| GET | `/settings/public` | only `membershipFormUrl`, `membershipPriceBdt` | `200 Settings` |
| POST | `/contact` | `{ name, email, message, website }`; `website` = honeypot (silently `202`); name 1–100, message 1–5000, 5/hr per IP | `202 { accepted: true }` / `502 delivery_failed` |

## Member auth

| Method | Path | Auth | Body | Success | Errors |
|---|---|---|---|---|---|
| POST | `/auth/signup/request-otp` | — | `{ email }` | `200 { sent: true }` | `409 email_taken`, `429`, `502` |
| POST | `/auth/signup/verify-otp` | — | `{ email, code }` | `200 { signupToken }` | — |
| POST | `/auth/signup/complete` | — | `{ signupToken, name, hscBatch, password }` | `201 User` + `dcitc_at` | `401` (expired token), `409 email_taken` |
| POST | `/auth/login` | — | `{ email, password }` | `200 User` + `dcitc_at` | `429` |
| POST | `/auth/logout` | — | — | `204`, clears `dcitc_at`, revokes all sessions | — |
| GET | `/auth/me` | user | — | `200 User` | `401` |
| PATCH | `/auth/password` | user | `{ currentPassword, newPassword }` | `200 { updated: true }` | — |
| POST | `/auth/password/forgot` | — | `{ email }` | `200 { sent: true }` | `409 email_not_found`, `429`, `502` |
| POST | `/auth/password/reset` | — | `{ email, code, password }` | `200 { reset: true }` | — |
| POST | `/auth/email/recover` | — | `{ name, hscBatch }` | `200 { sent: true }` (always) | — |
| GET | `/auth/google/start` | — | — | `302` → Google | — |
| GET | `/auth/google/callback` | — | `?code&state` | `302` → `/dashboard` + `dcitc_at` | `/login?error=` |

**Rules:** password ≥ 8 chars. OTP: 6 digits, 10 min expiry, 5 attempts, 60s resend cooldown, 3/hr cap per email. `request-otp`/`forgot` are outcome-reporting; `verify-otp`/`email/recover` are outcome-neutral. `hscBatch` optional, stored as `""` if blank. Password change/reset bumps `token_version` (old cookies → `401`). Google sign-in links `google_sub` to existing account; needs verified email. Google callback errors: `oauth_denied`, `oauth_state`, `oauth_email`, `oauth_failed`. Rate limits key on client IP + email (OTP/reset) or IP alone (contact), plus a per-IP ceiling (100 OTP/reset per hr, 200 logins per hr) above the per-account limit. Logout bumps `token_version` for the whole account.

## Admin content

All routes require `dcitc_admin` cookie.

| Method | Path | Body | Success |
|---|---|---|---|
| POST | `/admin/auth/login` | `{ email, password }` | `200 Admin` + `dcitc_admin` |
| POST | `/admin/auth/logout` | — | `204` |
| GET | `/admin/auth/me` | — | `200 Admin` |
| GET | `/admin/achievements` | — | `200 Achievement[]` |
| POST | `/admin/achievements` | `{ title, detail, year, image, gallery? }` | `201 Achievement` |
| PATCH | `/admin/achievements/:id` | partial | `200 Achievement` |
| DELETE | `/admin/achievements/:id` | — | `204` + audit |
| PUT | `/admin/achievements/:id/featured` | `{ slot: 0-4\|null }` | `200 Achievement` |
| GET | `/admin/intels` | — | `200 Intel[]` |
| POST | `/admin/intels` | `{ slug, title, excerpt, content, tag, author, date, image }` | `201 Intel` |
| PATCH | `/admin/intels/:id` | partial, `slug` ignored | `200 Intel` |
| DELETE | `/admin/intels/:id` | — | `204` + audit |
| PUT | `/admin/intels/:id/featured` | `{ slot: 0-2\|null }` | `200 Intel` |
| GET | `/admin/leadership` | `?batch=` | `200 Leader[]` |
| POST | `/admin/leadership` | `{ name, role, tier, batch, image, facebook?, linkedin?, github?, portfolio?, sortOrder? }` | `201 Leader` |
| PATCH | `/admin/leadership/:id` | partial | `200 Leader` |
| DELETE | `/admin/leadership/:id` | — | `204` + audit |
| PUT | `/admin/settings` | `{ membershipFormUrl?, membershipPriceBdt? }` | `200 Settings` |
| POST | `/admin/uploads/sign` | `{ filename, contentType }` | `200 { uploadUrl, token, path, publicUrl }` |

`image` required (`400`), `author` required on Intel (`400`). Featured slot conflict → `409 slot_taken`. Duplicate slug → `409 slug_taken`. Admin login case-insensitive email; inactive admin → `401`. Uploads: `image/jpeg|png|webp` only; client PUTs to `uploadUrl`; service-role key never returned.

## Super admin

Requires `dcitc_admin` with `role: "super_admin"` (else `403`).

| Method | Path | Body | Success |
|---|---|---|---|
| GET | `/super-admin/admins` | — | `200 Admin[]` |
| POST | `/super-admin/admins` | `{ email, name, password, role }` | `201 Admin` |
| PATCH | `/super-admin/admins/:id` | `{ name?, email?, active? }` | `200 Admin` |
| POST | `/super-admin/admins/:id/rotate-password` | `{ password }` | `200 { rotated: true }` |
| GET | `/super-admin/audit-log?limit=50` | — | `200 AuditEntry[]` (max 200) |

Duplicate email case-insensitive → `409`. Deactivate/rotate bumps `token_version`. Self-modify → `400 cannot_modify_self`. Deactivating last super admin → `409 last_super_admin`.

## Status codes

`200` read/update · `201` created · `202` accepted · `204` deleted/logged out · `400` validation · `401` auth · `403` role · `404` missing · `409` conflict · `413` too large · `429` rate limited · `502` mail/upload failure · `503` DB down