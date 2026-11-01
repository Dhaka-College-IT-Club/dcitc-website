# Tasks

Paths are relative to `backend/` unless they name `frontend/`. No database migration, dependency, or environment change is required.

## 1. Google OAuth diagnostics

- [x] 1.1 In `src/services/google.ts`, make `exchangeCode()` read the non-OK token response, ignore non-string fields, truncate `error_description` to 200 characters, and throw a typed `GoogleExchangeError` carrying Google's `error`/`error_description`; make `verifyGoogleIdToken()` log `{ "level": "warn", "message": "google_id_token_verify_failed", "name", "detail" }` before returning `null`. Verify with unit tests that stub `globalThis.fetch` for a `400 invalid_grant` response and an unreadable body, and assert the error fields, truncation, and that no code/secret appears in the error text; run `npm run lint`.
- [x] 1.2 In `src/routes/auth.ts`, track `step` (`exchange` → `verify` → `user`), log exactly one `google_oauth_failed` line on failure with `{ level, message, step, name, detail }`, and handle `req.query.error` before the code/state checks by logging `google_oauth_denied` and redirecting `oauth_denied`. Verify with integration tests: `?error=access_denied` redirects to `/login?error=oauth_denied`, and a stubbed client throwing at each stage yields `oauth_failed` with the matching `step` in the captured log; assert the authorization code and token strings never appear in captured output.
- [x] 1.3 In `frontend/src/app/(auth)/login/page.tsx`, replace the single generic OAuth message with a reason map for `oauth_denied`, `oauth_state`, `oauth_email`, and `oauth_failed`, plus a generic fallback. Verify with `npm run lint` and `npm run build` in `frontend/`, and confirm each query value renders its own sentence.

## 2. OTP issuance without code loss

- [ ] 2.1 **Superseded by `fix-signup-mail-delivery` task 2.1 — do not implement.** The send-before-write ordering described here is replaced by write → send → reconcile: the OTP row is inserted first, delivery is awaited, the new row is deleted on failure, and older rows are consumed only after a confirmed send.
- [ ] 2.2 **Superseded by `fix-signup-mail-delivery` tasks 2.2–2.3 — do not implement as written.** `MailDeliveryError` still maps to `502 delivery_failed`, but the cooldown decision is reversed: the 60-second cooldown and hourly cap now answer `429 rate_limited` with `Retry-After` on both `signup/request-otp` and `password/forgot`, and a registered signup address answers `409 email_taken`.

## 3. Atomic OTP verification

- [x] 3.1 In `src/services/otp.ts`, replace the read-then-write increment with a single conditional `UPDATE ... SET attempts = attempts + 1 ... WHERE id = ? AND consumed_at IS NULL AND attempts < 5 RETURNING attempts`, and consume with a conditional `UPDATE ... SET consumed_at = now() ... WHERE id = ? AND consumed_at IS NULL RETURNING id`. Verify with the existing five-attempt test plus a new concurrent test that fires six wrong attempts with `Promise.all` and asserts the stored count never exceeds 5 and every extra attempt returns `otp_exhausted`; run `npm test`.
- [x] 3.2 Add a concurrent-correct-submission test: two parallel verifications of the same code against the real database yield exactly one success and one `invalid_otp`. Verify the row is consumed once and `npm test` passes.

## 4. Rate-limit keying and proxy depth

- [x] 4.1 Change `src/app.ts` to `app.set("trust proxy", 2)` and make `otpLimiter`/`passwordResetLimiter` key on `${resolvedIp}:${normalizedEmail}` when the body has a string email, otherwise the IP. Verify with a new `test/rateLimit.test.ts` that enables limits, sends `X-Forwarded-For: <client>, <shared egress>` to `/api/v2/contact`, exhausts one client, and asserts a second client with the same egress is not throttled; confirm the test fails with `trust proxy` set to `1` and passes at `2`.
- [x] 4.2 Set `MAIL_TRANSPORT=log` in `test/setup.ts` so limiter and route tests make no network mail calls, and confirm the mail-failure unit tests still pass; run `npm test`.
- [x] 4.3 Add a README deployment note: the API trusts two proxy layers (Vercel → Render edge), the trust depth must be reviewed if the topology changes, and a direct request to the Render hostname can forge the forwarded chain. Verify the note matches the deployed topology in `backend/render.yaml` and `frontend/next.config.ts`.
- [ ] 4.4 In staging, send one request through the public frontend with a temporary `req.ip`/forwarded-chain log line (do not log emails, cookies, or codes), record the resolved address and chain length, and remove the diagnostic line. Verify the resolved address is the browser's, not the Vercel egress, and update the trust depth if the chain differs. **Requires manual verification post-deploy — see `docs/post-deploy-verification-auth-oauth-otp.md`.**

## 5. Integration verification

- [x] 5.1 Run `npm run lint && npm test` in `backend/` against the disposable database and `npm run lint && npm run build` in `frontend/`; record the commands and results.
- [ ] 5.2 Exercise Google sign-in once in staging and confirm the login page shows the specific reason, the API log names the failed step, and neither the authorization code nor tokens appear in logs. **Requires manual verification post-deploy — see `docs/post-deploy-verification-auth-oauth-otp.md`.**
- [ ] 5.3 Exercise signup and password reset with the mail transport stopped: confirm `502 delivery_failed`, then confirm the previously issued code still verifies once the transport is restored. **Requires manual verification post-deploy — see `docs/post-deploy-verification-auth-oauth-otp.md`.**

## Workflow follow-up

- Archive the change after review and the staging checks in 4.4 and 5.2.
