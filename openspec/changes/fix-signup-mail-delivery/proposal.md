# Proposal

## Why

Nobody can sign up. Every account-creating path that needs an email code is dead in production, and the failure is invisible from both ends.

**Root cause is infrastructure, verified by measurement — not Gmail credentials and not code logic:**

| Probe | Result |
|---|---|
| `POST /api/v2/auth/signup/request-otp` against the local backend, same `.env`, same Gmail account | `200` in **3.6 s** — message accepted |
| same endpoint against `https://api.dcitc.org` (Render) | `200` once in **23 s**, then **no response for >120 s** on three attempts |
| `POST /api/v2/contact` against Render (also just sends mail) | **no response for >100 s** |
| `https://www.dcitc.org/api/v2/...` (the real browser path) | **502 `ROUTER_EXTERNAL_TARGET_ERROR` after 120.6 s** |
| `http://localhost:3000/api/v2/...` (Next dev rewrite) | **500 after 30.1 s** |

Render blocks outbound traffic to SMTP ports `25/465/587` on free web services (changelog, rollout complete 2025-09-26), and port `25` stays blocked even on paid instances because Render runs on EC2. Local egress works; Render egress does not. Nodemailer's default `connectionTimeout` is 120 s and the mail layer retries once, so the API sits on a dead TCP connect for up to four minutes. The browser never sees a response: Vercel's router aborts at 120 s with a plain-text 502, the Next dev proxy aborts at 30 s with a plain-text 500. `apiFetch` has no timeout of its own, so the button spins for two minutes and then shows `Request failed (502)`.

Then the code hides the failure: `signup/request-otp` swallows every mail error and answers `200 {"sent":true}`, so the one time the send actually returned fast enough, the user advanced to the code step for an email that was never sent.

**Why now:** SMTP can no longer work from this host. No configuration change fixes it, and every retry burns a code and starts a cooldown.

**Two unrelated-but-in-scope defects surfaced while tracing this and are fixed here:** the signup form's HSC batch field is hard-coded to Dhaka-College batch labels (`DC-27`), blocking the club's move to members from other colleges; and Google signups store an empty `hscBatch` while email signups require one, so the same column has two meanings.

## What Changes

### 1. Replace Gmail SMTP/Nodemailer with Resend for all outbound mail — **BREAKING** (deployment config)

Decision, not an option to evaluate: Resend is the mailer from here on.

- Remove `nodemailer` from `backend/package.json` and delete the `smtp` transport path in `backend/src/mail/index.ts`.
- Send through Resend's HTTP API (`POST https://api.resend.com/emails`) using the runtime's built-in `fetch`. No new dependency, no SDK, no host/port/secure negotiation, no STARTTLS, no App Password.
- Keep the exported surface unchanged so callers do not move: `sendSignupOtp`, `sendResetOtp`, `sendEmailRecovery`, `sendContactNotification`, `renderOtpEmail`, `MailDeliveryError`, `testOutbox`.
- Remove every SMTP/Gmail variable from `backend/.env`, `backend/.env.example`, and the Render service config: `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_SECURE`, `SMTP_FROM`. Nothing Gmail- or SMTP-specific may remain in the codebase.
- Add `RESEND_API_KEY`, `EMAIL_FROM` (verified-domain sender, e.g. `no-reply@dcitc.org`), optional `EMAIL_FROM_NAME`. `.env.example` gets placeholders only, never real values.
- Keep `MAIL_TRANSPORT` but narrow it to `resend | log`, so tests and local development still capture codes without network calls (the `log` value remains refused in production).
- Bound the HTTP call with an explicit abort timeout (~10 s) and send an `Idempotency-Key` derived from the OTP row/message id, so a retried request cannot deliver two codes.

### 2. A mail failure is never silently swallowed

- `backend/src/routes/auth.ts` — `signup/request-otp` answers `502 delivery_failed` on a mail failure (matching `routes/contact.ts`) instead of `200 {"sent":true}`.
- `backend/src/mail/index.ts` — drop the blind single retry in `deliver()`. One attempt, fail fast, throw.
- `backend/src/services/otp.ts` — a send failure must not cost the user their previous code and must not start a cooldown: the new row is written, the send is attempted, and on failure the new row is removed and older unconsumed rows are left alone. Only a confirmed send invalidates the previous code.
- `backend/src/routes/auth.ts` — an already-registered email returns `409 email_taken` with a clear message instead of a fake success.
- `backend/src/routes/auth.ts` — restore the `AppError` re-throw removed in `777a151`, so the 60 s per-address cooldown and the 3/hour cap surface as real `429` responses the UI can explain.

**Accepted trade-off:** the 409 and the 429 together reintroduce an account-existence oracle that `777a151` deliberately closed. The decision is explicit: a signup flow that reports failure accurately is worth more than hiding whether an address is registered. This is recorded in `design.md`.

### 3. The client gives up before the proxy does

- `frontend/src/lib/api.ts` — `apiFetch` gets a default `AbortSignal.timeout(15_000)` (merged with any caller signal via `AbortSignal.any`), so a stalled request becomes a visible, specific error instead of an infinite spinner.

### 4. Local development stops testing production

- `frontend/.env.local` gets `API_ORIGIN=http://localhost:4000`. Today `frontend/.env` points at `https://api.dcitc.org`, so `localhost:3000` proxies to Render — confirmed by `x-render-origin-server: Render` on a `localhost:3000` response — which is why local fixes appeared to do nothing.

### 5. HSC batch becomes a year, not a club-internal label

- `frontend/src/app/(auth)/signup/page.tsx` and `frontend/src/app/(auth)/forgot-email/page.tsx` — drop the hard-coded `BATCHES = ["DC-27","DC-26","DC-25"]` lists and the `DC-27` placeholder; use a plain year example (`2027`). Both files stop keeping their own copy of the list.
- `hscBatch` becomes **optional** on both signup paths, which is the only way to make the column mean one thing: Google signups already store `""`, and there is no endpoint that could ask a Google user for it afterwards.
- Flagged, not fixed here: `hscBatch` doubles as a recovery credential (`/auth/email/recover` matches name + batch). Making it optional means blank-batch accounts cannot use that page; they recover through Google sign-in or an admin. Low risk right now — the production `users` table is empty — but it must be stated rather than discovered later.

## Capabilities

### New Capabilities

- `email-delivery`: how the system sends transactional mail — provider, required configuration, provider-failure classification, and the guarantee that one logical message is delivered at most once.
- `user-auth`: signup OTP issuance and verification semantics — code lifecycle across send failure, cooldown and hourly-cap responses, registered-address reporting, and what `hscBatch` means.
- `auth-experience`: what the signup and account-recovery forms show — client-side request deadlines, provider-failure copy, and the batch-field input contract.

### Modified Capabilities

None. `openspec/specs/` is empty; the capabilities above are being established here and will be the paths the in-flight `fix-auth-oauth-otp-rate-limits` change modifies.

## Impact

**Code**

| Area | Files |
|---|---|
| Mail transport | `backend/src/mail/index.ts` (rewrite), `backend/package.json` |
| Config | `backend/src/config/env.ts`, `backend/.env`, `backend/.env.example`, `backend/render.yaml` |
| OTP lifecycle | `backend/src/services/otp.ts` |
| Routes | `backend/src/routes/auth.ts` |
| Client | `frontend/src/lib/api.ts`, `frontend/.env.local` |
| Forms | `frontend/src/app/(auth)/signup/page.tsx`, `frontend/src/app/(auth)/forgot-email/page.tsx` |
| Tests | `backend/test/{auth,unit}.test.ts`, `backend/test/setup.ts` |
| Docs | `README.md`, `docs/post-deploy-verification-auth-oauth-otp.md` |

**API contract**

- `POST /api/v2/auth/signup/request-otp`: `200 {sent:true}` becomes a real outcome — `502 delivery_failed` when mail fails, `409 email_taken` for a registered address, `429 rate_limited` for cooldown/hourly cap. `POST /api/v2/auth/password/forgot` inherits the same mapping for consistency unless review decides otherwise.
- No database migration. `hsc_batch` stays `text NOT NULL DEFAULT ''`.
- Dependency change: one removed (`nodemailer`), none added.

**Deployment prerequisite (blocking)**

- A Resend account with `dcitc.org` verified, a sending key, and `EMAIL_FROM` on that domain. Until the DNS records are verified, `RESEND_API_KEY` alone will not send.
- `RESEND_API_KEY` + `EMAIL_FROM` set in Render, and all `SMTP_*` variables deleted there. `.env` changes must be mirrored in the dashboard — `render.yaml` is a blueprint, not the live config, which is exactly how the plan-vs-reality gap that hid this bug happened.

**Relationship to the in-flight change**

`fix-auth-oauth-otp-rate-limits` already specifies mail-failure handling and OTP issuance ordering (tasks 2.1 and 2.2, both checked) whose code is not present in the tree — `routes/auth.ts` still swallows failures and `services/otp.ts` still invalidates before sending. Those two tasks are **superseded by this change** and one of the two must be reconciled before either is archived. Its cooldown decision (keep `200 {sent:true}` to avoid enumeration) is **reversed** here by an explicit product call. Everything else in that change — Google diagnostics, atomic verification, `trust proxy` depth — is untouched.

**Rollback**

Source-only except deployment config: restore the previous build and re-add the `SMTP_*` variables. No migration means a plain revert restores the old binary. Rollback does not restore email delivery in production, because SMTP never worked there.
