# Design

## Context

See `proposal.md` — Why. The constraints that shape the approach:

- The API runs on Render and cannot open outbound SMTP connections (ports `25/465/587` blocked on free services; `25` blocked on paid too). Local egress is unaffected, which is why every local check passes.
- Nodemailer 10.3.1 defaults to a 120 s connection timeout, and `deliver()` retries once. Worst case per request is ~4 minutes of a held HTTP connection — longer than both proxies in front of it will wait.
- The deployed topology is browser → Vercel rewrite → Render → Supabase Postgres. Vercel aborts the rewrite at 120 s (measured: 502 `ROUTER_EXTERNAL_TARGET_ERROR` at 120.6 s). Next's dev proxy has a hard 30 s default (`proxyTimeout || 30_000` in `next/server/lib/router-utils/proxy-request.js`).
- `backend/.env` has `NODE_ENV=production` and `MAIL_TRANSPORT=smtp`, and `test/setup.ts` never overrides the transport — so `npm test` runs against the real Gmail account unless `MAIL_TRANSPORT=log` is exported by the developer's shell. CI only passes because `.github/workflows/ci.yml` sets it.
- `nodemailer` is imported in exactly one module (`backend/src/mail/index.ts`). No other module knows the transport.
- The `users` table is empty in production and `hsc_batch` is `text NOT NULL DEFAULT ''`, so the batch-format change needs no migration or backfill.

## Goals / Non-Goals

**Goals:**

- Outbound mail works from Render on the day this ships, with no host/port/TLS negotiation to misconfigure.
- Any future mail outage degrades to a fast, specific, user-visible error — never a two-minute spinner.
- One reason for one outcome: success, delivery failure, registered address, and throttling are four distinguishable responses, and the form renders each differently.
- A failed send costs the user nothing.

**Non-Goals:**

- No outbox queue, background worker, or retry-with-backoff service. One attempt per request; the user retries by pressing the button.
- No email templates beyond the existing plaintext/HTML pair, no design refresh.
- No change to OTP hashing, TTL, attempt limits, or JWT shapes.
- No profile-edit endpoint. `hscBatch` becomes optional; it is not made editable after signup.
- No fix for the `trust proxy` depth or the Google OAuth diagnostics — those stay with `fix-auth-oauth-otp-rate-limits`.

## Decisions

### D1. Resend over the built-in `fetch`, not the SDK

`POST https://api.resend.com/emails` with `Authorization: Bearer $RESEND_API_KEY` and a JSON body (`from`, `to`, `subject`, `text`, `html`, `reply_to`). Node 24 has global `fetch` and `AbortSignal.timeout`, so no dependency is added and `nodemailer` is removed outright.

*Alternatives:* the `resend` SDK (adds a dependency and a version surface for four fields); SendGrid/Postmark (same shape, more setup for no benefit); keeping SMTP and upgrading the Render plan (does not remove the failure mode — port 25 stays blocked and the plan tier is invisible to the code, which is precisely how this outage went unnoticed).

The existing Google OAuth tests already stub `globalThis.fetch`, so the same technique covers mail.

### D2. Keep `MAIL_TRANSPORT`, narrow its values to `resend | log`

The `log` path is load-bearing: `backend/test/auth.test.ts` and `content.test.ts` assert against `testOutbox`, and development relies on codes printed to the console. Keeping the variable name avoids touching CI and the README's local-dev instructions; only the `smtp` value disappears.

`test/setup.ts` will set `MAIL_TRANSPORT=log` explicitly so tests stop inheriting `backend/.env`'s production-ish transport.

### D3. One attempt, one explicit deadline

`deliver()` loses its retry loop. Each call gets `AbortSignal.timeout(10_000)` — an order of magnitude below the 30 s dev proxy and 120 s Vercel ceiling, so the API always answers before the proxy gives up.

Retrying inside the request was the wrong instinct: it doubled the worst case and produced a second email when the first attempt had actually succeeded but the response was slow. Retrying is the user's decision, made from an honest error message.

### D4. Derive the idempotency key from the message, not from a new parameter

Resend deduplicates on `Idempotency-Key` for 24 h. Deriving it as `sha256(operation | to | subject | text)` keeps `sendSignupOtp(to, code)` and the other four signatures byte-identical, which is what callers depend on. A repeated send of the same code is suppressed; a genuinely new code produces a new hash and a new email.

*Alternative:* pass a key in from the OTP row id — cleaner in principle, but it changes four exported signatures for no observable gain, and it would couple the mail module to the OTP table.

### D5. Provider failure is classified once, in the mail module

Every failure mode — non-2xx response, network error, abort — becomes `MailDeliveryError` (already exported and already mapped to `502 delivery_failed` by `routes/contact.ts`). The module logs one structured line with `operation`, HTTP status, and the provider's error `name` only. No API key, no message body, no code, no recipient address in failure logs.

Provider text is never returned to the client; the route answers the generic `deliveryFailed()`.

### D6. OTP issuance: write, send, then reconcile

Order inside `issueOtp`:

1. cooldown and hourly-cap checks (unchanged queries);
2. insert the new row (old rows untouched, still verifiable);
3. `await send(code)`;
4. on throw → delete the new row and rethrow, so the previous code survives, no cooldown starts, and the hourly count is unchanged;
5. on success → consume every other unconsumed row for that address and purpose.

*Alternatives:* send-then-insert (specified in `fix-auth-oauth-otp-rate-limits` task 2.1) leaves a window where a delivered code does not exist in the database — the user pastes a code that can never verify. Consume-then-insert is what ships today and is the bug. Marking the failed row consumed instead of deleting it keeps the cooldown and hourly counters poisoned by failures, which is exactly the outage behaviour we are removing.

Deleting the row is the one write that leaves no trace — acceptable, because a failed send produced nothing the user can act on.

### D7. `409` and `429` are worth the enumeration oracle

`777a151` deliberately flattened every outcome to `200 {sent:true}` so the per-address cooldown could not be used to discover which addresses have accounts. That defence is being given up on purpose: it also flattens *delivery failures* into success, which is how a month of "no email arrived" reports looked like nothing was wrong.

New mapping for `POST /auth/signup/request-otp`:

| Condition | Response |
|---|---|
| New address, delivered | `200 {sent:true}` |
| Registered address | `409 email_taken` |
| Inside 60 s cooldown | `429 rate_limited` + `Retry-After` |
| Over the 3/hour cap | `429 rate_limited` + `Retry-After` |
| Provider failure | `502 delivery_failed` |
| Validation failure | `400 validation_failed` |

The residual risk is real and bounded: the `otpLimiter` (10/hour per resolved client) still throttles bulk probing, and confirming an address exists tells an attacker nothing they could not learn from `/auth/login` timing or a password reset. `password/forgot` gets the same mapping so the two flows cannot be compared against each other.

### D8. Client deadline lives in `apiFetch`, once

`apiFetch` takes an optional `timeoutMs` (default `15_000`) and builds `AbortSignal.any([callerSignal, AbortSignal.timeout(timeoutMs)])`, dropping the caller's signal when it is absent (some runtimes reject `undefined` members). One default covers every JSON call; only a genuinely slow endpoint would need to opt out, and none exists today. Uploads do not use `apiFetch`.

An aborted request surfaces as a distinct message ("the request timed out") rather than `Request failed (502)`, because `AbortError`/`TimeoutError` never reaches `toApiError`.

### D9. `hscBatch` optional by removing one client check

The backend already accepts an empty string: `signupComplete.hscBatch` is `z.string().trim().max(50).default("")`. Only the signup form's `if (!hscBatch.trim())` guard makes it mandatory. Removing that guard, and marking the label optional, makes email and Google signups store the same thing (`""`) with no server change and no migration.

For the recovery page the field stays required — it is the lookup key. Consequence, documented rather than fixed: an account that left the batch blank cannot use `/forgot-email` and must recover through Google sign-in or an administrator. The users table is empty, so no existing account is affected.

### D10. Batch input is a plain year field

Both forms drop their local `BATCHES` array, the `<datalist>`, and `list=`, and use `placeholder="e.g. 2027"`. No regex: a student may type `2027`, `HSC-27`, or a college-specific label, and the spec forbids rejecting free-form values. `hint` on the signup field explains the value is used for account recovery.

Keeping one list in `frontend/src/constants.ts` was considered; a shared constant is still a club-internal list, so the list is deleted rather than relocated.

### D11. `EMAIL_FROM` + `EMAIL_FROM_NAME` replace `SMTP_FROM`

`SMTP_FROM` was a display-name-plus-address string (`DCITC <dcitc.org@gmail.com>`). Resend takes `from: "DCITC <no-reply@dcitc.org>"` in the same shape, so the split is optional — but two variables beat one string that must be parsed correctly in two places. `EMAIL_FROM_NAME` defaults to `DCITC`; `from` is composed as `Name <address>`.

### D12. `frontend/.env.local` wins for local development

`.env.local` overrides `.env` in Next's load order, so adding `API_ORIGIN=http://localhost:4000` there pins local development to the local API without editing the committed `.env` for everyone. This is a developer-experience fix, not a production change; the deployed frontend still resolves `https://api.dcitc.org`.

## Risks / Trade-offs

- **[Resend domain verification is a hard prerequisite]** → `EMAIL_FROM` must be on a domain with SPF/DKIM verified in Resend. Shipping the code before verification produces a different flavour of "no email". The migration plan makes this a gate, and `.env.example` documents the required domain.
- **[New single point of failure]** → one provider, no fallback. Accepted: SMTP had a 100% failure rate, so a working single provider is a strict improvement. A fallback is a separate change if it ever matters.
- **[Enumeration oracle reopened]** → see D7. Bounded by the IP limiter; the trade is deliberate and was made explicitly, not by omission.
- **[Idempotency can suppress a legitimate duplicate within 24 h]** → two byte-identical messages are almost certainly a retried delivery, not a user intent. A new code changes the body, so a real resend is never suppressed.
- **[Blank-batch accounts cannot use batch recovery]** → documented in D9; they keep Google sign-in.
- **[Deleting a row on send failure loses the audit trail of attempted sends]** → the structured failure log is the trail; under-counting abuse by failed attempts is preferable to locking out a legitimate user during an outage.
- **[`deliver()` no longer retries, so a transient provider blip surfaces to the user]** → that is the intended behaviour; the alternative hides outages. The user retries from an honest error message.
- **[In-flight change overlap]** → `fix-auth-oauth-otp-rate-limits` tasks 2.1/2.2 describe a different ordering and the opposite cooldown decision, and their checked state does not match the tree. Whoever applies this change must reconcile that file, or archive it as superseded, so two contradictory task lists do not both claim to be done.

## Migration Plan

1. **Gate:** create the Resend account, add `dcitc.org`, publish the SPF/DKIM records, wait for "Verified", create a sending API key.
2. Merge the code change; `npm run build` must pass with `nodemailer` removed from `package.json` and `package-lock.json`.
3. **Render dashboard** (not just `render.yaml`): add `RESEND_API_KEY`, `EMAIL_FROM`, `EMAIL_FROM_NAME`; delete `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_SECURE`, `SMTP_FROM`. Confirm the build uses the new lockfile.
4. Deploy and wait for **Live**. A startup failure here means the env validation is working — read the named variable and fix it in the dashboard.
5. Verify: request a signup code for a fresh address and receive it; submit the contact form and receive the notification; force a failure by setting `RESEND_API_KEY` to a wrong value and confirm `502 delivery_failed` within ~10 s instead of a hang, then restore it.
6. Rollback: revert the commit and re-add the `SMTP_*` variables. This restores the previous behaviour, **not working email** — the old path was already dead on Render. The only true rollback for mail is restoring the Resend configuration.

## Open Questions

- Is `no-reply@dcitc.org` the sender the club wants, or a monitored mailbox such as `hello@dcitc.org`? Only the address string changes, so this can be answered at deployment time.

`password/forgot` adopts the identical `409`/`429`/`502` mapping in this change. Leaving one flow honest and the other flat would let a prober compare them against each other and recover exactly the signal D7 gives up.
