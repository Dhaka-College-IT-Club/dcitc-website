# DCITC API contract (`/api/v2`)

Base URL locally: `http://localhost:4000` (browser traffic goes through the Next rewrite at
`/api/v2/*`).

## Envelopes

Success:

```json
{ "data": { } }
```

Error (any status â‰¥ 400):

```json
{ "error": { "code": "validation_failed", "message": "Some fields are invalid.", "fields": { "email": "Invalid email" } } }
```

Error codes: `validation_failed`, `unauthenticated`, `forbidden`, `not_found`,
`invalid_credentials`, `email_taken`, `slug_taken`, `slot_taken`, `invalid_otp`, `otp_expired`,
`otp_exhausted`, `rate_limited`, `delivery_failed`, `cannot_modify_self`, `last_super_admin`,
`internal_error`, `payload_too_large`.

Rate-limited responses are `429` and include `Retry-After`. Bodies are capped at 128 KB (`413`).

## Cookies

| Cookie | Set by | Lifetime | Flags |
|---|---|---|---|
| `dcitc_at` | user login / signup / Google callback | 7 days | `HttpOnly; SameSite=Lax; Path=/; Secure` in production |
| `dcitc_admin` | admin login | 7 days | same |
| `dcitc_oauth_state` | `GET /auth/google/start` | 5 minutes | same |

Cookies are first-party through the frontend rewrite. There is no CORS.

## Resource shapes

```ts
User        { id: string(uuid), email, name, hscBatch, createdAt }
Admin       { id: string(uuid), email, name, role: "admin"|"super_admin", active, lastLoginAt, createdAt }
Achievement { id: number, title, detail, year: number, image, gallery: string[], featuredSlot: number|null, createdAt, updatedAt }
Intel       { id: number, slug, title, excerpt, content, tag, author, date, image, featuredSlot: number|null, createdAt, updatedAt }
Leader      { id: number, name, role, tier: "executive"|"chief"|"joint", batch, image,
              facebook, linkedin, github, portfolio, sortOrder }
AuditEntry  { id: number, actorAdminId: string|null, action, targetType, targetId, metadata, createdAt }
Settings    { membershipFormUrl: string|null, membershipPriceBdt: number }
```

`image` is required on achievements, intels, and leadership. Optional links and
`featuredSlot` are `null` when unset.

## Public

### GET /health

`200` `{ "data": { "status": "ok", "database": "up" } }` â€” `503` with `"degraded"`/`"down"` if the database is unreachable.

```bash
curl -s http://localhost:4000/api/v2/health
```

### GET /achievements

All achievements, `year` descending then newest first, capped at 200. `?featured=true` returns only
featured rows ordered by `featuredSlot` ascending (max 5).

### GET /achievements/:id

One achievement, or `404 not_found` (also for non-numeric ids).

### GET /intels

All intels, newest first, capped at 200. `?featured=true` â†’ featured only, slot order, max 3.

### GET /intels/:slug

Exact lowercase slug lookup, or `404 not_found`.

### GET /leadership

All members ordered by batch descending, tier (`executive`, `chief`, `joint`), then `sortOrder`.
`?batch=DC-26` filters to an exact batch.

### GET /settings/public

Exactly two keys: `membershipFormUrl` and `membershipPriceBdt` (integer).

```bash
curl -s http://localhost:4000/api/v2/settings/public
```

### POST /contact

```json
{ "name": "Visitor", "email": "visitor@example.com", "message": "Hello", "website": "" }
```

`202` `{ "data": { "accepted": true } }`. `website` is a honeypot: a non-empty value returns the same
`202` and sends nothing. Limits: name 1â€“100, message 1â€“5000, 5 requests/hour per resolved client
IP. Delivery failure returns `502 delivery_failed`.

## Member auth

| Method | Path | Auth | Body | Success |
|---|---|---|---|---|
| POST | `/auth/signup/request-otp` | â€” | `{ email }` | `200 { data: { sent: true } }`, or `409 email_taken`, `429 rate_limited`, `502 delivery_failed` |
| POST | `/auth/signup/verify-otp` | â€” | `{ email, code }` | `200 { data: { signupToken } }` |
| POST | `/auth/signup/complete` | â€” | `{ signupToken, name, hscBatch, password }` | `201 User` + `dcitc_at` |
| POST | `/auth/login` | â€” | `{ email, password }` | `200 User` + `dcitc_at` |
| POST | `/auth/logout` | â€” | â€” | `204`, clears `dcitc_at` |
| GET | `/auth/me` | user | â€” | `200 User` or `401 unauthenticated` |
| PATCH | `/auth/password` | user | `{ currentPassword, newPassword }` | `200 { data: { updated: true } }` |
| POST | `/auth/password/forgot` | â€” | `{ email }` | `200 { data: { sent: true } }`, or `409 email_not_found`, `429 rate_limited`, `502 delivery_failed` |
| POST | `/auth/password/reset` | â€” | `{ email, code, password }` | `200 { data: { reset: true } }` |
| POST | `/auth/email/recover` | â€” | `{ name, hscBatch }` | `200 { data: { sent: true } }` always |
| GET | `/auth/google/start` | â€” | â€” | `302` to Google |
| GET | `/auth/google/callback` | â€” | `?code&state` | `302` to `/dashboard` + `dcitc_at`, or `/login?error=â€¦` |

Rules: passwords â‰¥ 8 characters; OTPs are 6 digits, expire in 10 minutes, allow 5 attempts, have a
60-second resend cooldown and a 3-per-hour cap per email. `request-otp` and `forgot` report their
outcome: `409` for the account mismatch (`email_taken` on signup, `email_not_found` on reset),
`429 rate_limited` for the cooldown or hourly cap, and `502 delivery_failed` when the provider
fails. They answer `200 { sent: true }` only after a confirmed delivery; a failed send leaves the
previously issued code valid. `verify-otp` and `email/recover` stay outcome-neutral. `hscBatch` is
optional and free-form on signup (stored as `""` when blank). Changing or resetting a password
bumps `token_version`, so older cookies return `401`. Google sign-in requires a verified email and
links `google_sub` onto an existing password account. Callback errors are `oauth_denied` (consent
denied), `oauth_state` (missing, expired, or mismatched state), `oauth_email` (unverified Google
email), and `oauth_failed` (exchange or provider failure). OTP and password-reset rate limits key on
the resolved client address plus the submitted email; contact limits key on the client address.

```bash
curl -s -c jar.txt -H "content-type: application/json" \
  -d '{"email":"member@example.com","password":"Password123!"}' \
  http://localhost:4000/api/v2/auth/login
curl -s -b jar.txt http://localhost:4000/api/v2/auth/me
```

`signupToken` is a 15-minute JWT bound to the verified email. `complete` returns
`409 email_taken` if the address was registered in between.

## Admin content

Every route below requires the `dcitc_admin` cookie. A member cookie never satisfies them.

| Method | Path | Body | Success |
|---|---|---|---|
| POST | `/admin/auth/login` | `{ email, password }` | `200 Admin` + `dcitc_admin` |
| POST | `/admin/auth/logout` | â€” | `204` |
| GET | `/admin/auth/me` | â€” | `200 Admin` |
| GET | `/admin/achievements` | â€” | `200 Achievement[]` |
| POST | `/admin/achievements` | `{ title, detail, year, image, gallery? }` | `201 Achievement` |
| PATCH | `/admin/achievements/:id` | partial of the above | `200 Achievement` |
| DELETE | `/admin/achievements/:id` | â€” | `204` + audit entry |
| PUT | `/admin/achievements/:id/featured` | `{ slot: 0-4 \| null }` | `200 Achievement` |
| GET | `/admin/intels` | â€” | `200 Intel[]` |
| POST | `/admin/intels` | `{ slug, title, excerpt, content, tag, author, date, image }` | `201 Intel` |
| PATCH | `/admin/intels/:id` | partial; `slug` is ignored | `200 Intel` |
| DELETE | `/admin/intels/:id` | â€” | `204` + audit entry |
| PUT | `/admin/intels/:id/featured` | `{ slot: 0-2 \| null }` | `200 Intel` |
| GET | `/admin/leadership` | `?batch=` | `200 Leader[]` |
| POST | `/admin/leadership` | `{ name, role, tier, batch, image, facebook?, linkedin?, github?, portfolio?, sortOrder? }` | `201 Leader` |
| PATCH | `/admin/leadership/:id` | partial | `200 Leader` |
| DELETE | `/admin/leadership/:id` | â€” | `204` + audit entry |
| PUT | `/admin/settings` | `{ membershipFormUrl?: string\|null, membershipPriceBdt?: integer }` | `200 Settings` |
| POST | `/admin/uploads/sign` | `{ filename, contentType }` | `200 { uploadUrl, token, path, publicUrl }` |

`image` is required (`400 fields.image` when empty), as is an intel `author` (`400 fields.author` when
blank). Featured slots are unique: a taken slot returns
`409 slot_taken` and changes nothing. Duplicate intel slugs return `409 slug_taken`. Admin login is
case-insensitive on email; inactive admins get `401 invalid_credentials`.

Uploads: only `image/jpeg`, `image/png`, `image/webp`. The client `PUT`s the file to `uploadUrl` and
stores `publicUrl`. The service-role key never appears in a response.

```bash
curl -s -c admin.jar -H "content-type: application/json" \
  -d '{"email":"super@dcitc.local","password":"SuperAdmin123!"}' \
  http://localhost:4000/api/v2/admin/auth/login

curl -s -b admin.jar -H "content-type: application/json" \
  -d '{"title":"Robotics Finalist","detail":"Top six nationwide.","year":2026,"image":"/hero.png"}' \
  http://localhost:4000/api/v2/admin/achievements

curl -s -b admin.jar -X PUT -H "content-type: application/json" \
  -d '{"slot":0}' http://localhost:4000/api/v2/admin/achievements/7/featured
```

## Super admin

Requires `dcitc_admin` with `role: "super_admin"`; an `admin` gets `403 forbidden`.

| Method | Path | Body | Success |
|---|---|---|---|
| GET | `/super-admin/admins` | â€” | `200 Admin[]` |
| POST | `/super-admin/admins` | `{ email, name, password, role }` | `201 Admin` |
| PATCH | `/super-admin/admins/:id` | `{ name?, email?, active? }` | `200 Admin` |
| POST | `/super-admin/admins/:id/rotate-password` | `{ password }` | `200 { data: { rotated: true } }` |
| GET | `/super-admin/audit-log?limit=50` | â€” | `200 AuditEntry[]` (newest first, max 200) |

Duplicate admin emails are case-insensitive (`409 email_taken`). Editing writes `admin.updated`,
deactivating/reactivating writes `admin.deactivated`/`admin.activated`, each with the acting
super admin as `actorAdminId`. Deactivating or rotating bumps `token_version`, so existing
cookies fail immediately; a deactivated admin gets `401 invalid_credentials` at login. Editing,
deactivating, and rotating your own account returns `400 cannot_modify_self`. Deactivating the
last active super admin returns `409 last_super_admin` (checked under a lock, so two concurrent
deactivations cannot leave zero).

## Status codes used

`200` read/update Â· `201` created Â· `202` contact accepted Â· `204` deleted/logged out Â·
`400` validation or OTP problem Â· `401` auth Â· `403` role Â· `404` missing Â· `409` conflict Â·
`413` body too large Â· `429` rate limited Â· `502` mail/upload failure Â· `503` health degraded.
