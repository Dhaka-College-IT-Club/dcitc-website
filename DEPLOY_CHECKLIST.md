# Deploy checklist

Production-specific checks for the API (`backend/`, Render/Railway) and its Supabase
project. Local setup is covered in `backend/README.md`.

## 1. Storage bucket limits

`backend/src/uploads/index.ts` creates the `uploads` bucket with `public: true`,
`fileSizeLimit: 5 MiB`, and `allowedMimeTypes: image/jpeg, image/png, image/webp`.
Signed uploads plus those bucket limits are what stop a leaked signed URL from
carrying oversized or non-image files.

- Fresh production Supabase project: run `npm run storage:setup` once and nothing
  else is needed — the bucket is created with both limits already enforced.
- Only relevant when reusing an existing bucket created before this logic: the
  script leaves an existing bucket untouched, so open Storage → `uploads` →
  settings and set the 5 MiB size limit and the three image MIME types, or delete
  and re-create the bucket (empty it first; public URLs change for existing objects
  only if object paths change, which they do not on re-create of the same name).

### Frontend image configuration

The public site renders uploads through `next/image`. Set these on the frontend host
(Vercel):

- `NEXT_PUBLIC_SUPABASE_URL` — hosted project URL. `frontend/next.config.ts` derives
  the allowed image host from it, and `lib/images.ts` rewrites loopback URLs saved
  during local development to this origin.
- `NEXT_PUBLIC_UPLOAD_BUCKET` — defaults to `uploads`.
- `IMAGE_REMOTE_HOSTS` — only for extra hosts; leave empty when the Supabase URL is set.

The bucket must stay public-read. If it is private, the admin thumbnail (a plain
`<img>`) still loads for a signed-in browser while every public `next/image` request
fails, which is exactly the broken state this configuration prevents.

## 2. Verify `trust proxy` (single reverse proxy)

`app.set("trust proxy", 1)` in `backend/src/app.ts` assumes one platform proxy in
front of the service (Render/Railway default). Rate limiters and per-IP logging key
off `req.ip`, so a wrong hop count silently groups every visitor under the
load-balancer IP.

After the first deploy, log `req.ip` for one incoming request — run the request
logger at debug level for a minute, or add a temporary `console.log(req.ip)` in
`src/app.ts` and remove it afterwards. Then call a public endpoint from your own
network (for example `GET /api/v1/health`) and confirm the logged address is your
real public client IP, not a private address such as `10.x.x.x` or the platform's
internal load-balancer address. If it shows the wrong address, the proxy chain has
a different number of hops: change the `trust proxy` value to match it instead of
trusting every proxy.

## 3. Database TLS / `DB_SSL_CA`

Remote production connections use TLS with `rejectUnauthorized: true`. Whether they
connect depends on the provider's certificate chain being verifiable:

- Supabase's pooler certificate chains to a public CA: no extra configuration.
- A provider that signs with its own CA: set `DB_SSL_CA` in the host's environment
  to the provider's PEM certificate (write newlines as `\n`). Without it the
  connection fails closed rather than downgrading verification — that is intended.
- Never set `NODE_ENV=production` for a local database you expect to reach without
  TLS; local hosts are detected and skip TLS, but anything remote will verify.

`DB_SSL_CA` is read from the environment, so it does not appear in `render.yaml`;
add it in the host dashboard if the provider requires it.

## 4. Local setup change: admin seeding

This is a breaking change to local setup. `ADMIN_EMAIL` / `ADMIN_PASSWORD` are no longer read
and no longer seed a default admin account. Only `SUPER_ADMIN_EMAIL` / `SUPER_ADMIN_PASSWORD`
seed an account on first boot; anyone relying on the old default admin must now sign in as the
seeded super admin and create admins from the dashboard (Super admin → Operators → New
operator). Existing admin rows in an already-seeded database are left untouched.

## 5. Still worth a human security review

These cannot be automated here and should be checked before the public launch:

- **Secret rotation** — `JWT_USER_SECRET`, `JWT_ADMIN_SECRET`, `OTP_PEPPER`,
  `SUPER_ADMIN_PASSWORD`, `SMTP_PASS`, `SUPABASE_SERVICE_ROLE_KEY`
  must be fresh values in the host, not the ones used in local `.env` files, and
  must never have been committed. Rotating the JWT secrets signs everyone out.
- **Google Console review** — OAuth consent screen, authorized redirect URI, and
  branding match the real frontend origin; test the full sign-in flow from the
  production domain, not just localhost.
- **SMTP deliverability** — SPF, DKIM, and DMARC for the sending domain; send a
  real signup and password-reset email to Gmail and Outlook and confirm neither is
  filed as spam. `MAIL_TRANSPORT=smtp` is enforced in production.
- **Bucket policy review** — confirm `uploads` is public-read only (no
  unauthenticated writes), object paths are unguessable, and the service-role key
  is used only by the API.
