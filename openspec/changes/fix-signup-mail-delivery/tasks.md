# Tasks

Paths are relative to the repository root. `backend/` and `frontend/` are separate npm projects; each has its own `lint` (type-check) and `test`/`build`.

## 1. Mail transport on Resend

- [x] 1.1 Rewrite `backend/src/mail/index.ts` to send through `POST https://api.resend.com/emails` with the built-in `fetch`: bearer `RESEND_API_KEY`, `from` composed from `EMAIL_FROM_NAME`/`EMAIL_FROM`, `text`/`html`/`reply_to`, an `Idempotency-Key` header of `sha256(operation|to|subject|text)`, and an `AbortSignal.timeout(10_000)`. Remove the nodemailer import, the transporter, and the retry loop. Keep every exported name and signature (`sendSignupOtp`, `sendResetOtp`, `sendEmailRecovery`, `sendContactNotification`, `renderOtpEmail`, `MailDeliveryError`, `testOutbox`) and keep the `log` transport writing the plaintext body. In `backend/src/config/env.ts`, delete `SMTP_HOST/PORT/USER/PASS/FROM/SECURE` and the now-unused `boolish` helper, add required-when-sending `RESEND_API_KEY`, `EMAIL_FROM`, optional `EMAIL_FROM_NAME`, and change `MAIL_TRANSPORT` to `z.enum(["resend","log"]).default("resend")` with a `superRefine` that requires the two mail variables when the transport is `resend`. Verify with `npm run lint` and `npm run build` in `backend/`.

- [x] 1.2 Make the test suite hermetic: add `process.env.MAIL_TRANSPORT = "log";` to `backend/test/setup.ts` beside the other environment pins, so tests stop inheriting `MAIL_TRANSPORT=resend` from `backend/.env`. Verify by adding an assertion in `backend/test/unit.test.ts` that the loaded `env.MAIL_TRANSPORT` is `"log"` with no shell override set, and by confirming `npm test` in `backend/` completes with no outbound `fetch` to `api.resend.com`.

- [x] 1.3 Replace the spawned-process SMTP-failure test in `backend/test/unit.test.ts` with in-process tests that stub `globalThis.fetch`: a non-2xx response and a rejected fetch each raise `MailDeliveryError`; a successful 200 resolves; the captured log line for a failure contains neither the API key nor the verification code; the `Idempotency-Key` header is identical for two sends of the same message and different when the code changes. Verify with `npm test` in `backend/` and by confirming `grep -n "SMTP_\|nodemailer" backend/test/unit.test.ts` returns nothing.

- [x] 1.4 Remove `nodemailer` and `@types/nodemailer` from `backend/package.json` and the lockfile (`npm uninstall nodemailer @types/nodemailer`). Verify `npm ls nodemailer` reports no installed package and `npm run lint && npm run build && npm test` in `backend/` still pass.

- [x] 1.5 Update configuration and docs for the new provider. In `backend/.env.example`, delete the `SMTP_*` block and add `MAIL_TRANSPORT=log`, `RESEND_API_KEY=`, `EMAIL_FROM=` (placeholder such as `no-reply@example.com`), `EMAIL_FROM_NAME=DCITC` — no real values. Update `backend/render.yaml` env entries to the same three new keys and drop every `SMTP_*` entry. Update the README paragraph about local mail to describe the `log` transport and the Resend variables. Verify by running `git grep -nE "SMTP_(HOST|PORT|USER|PASS|FROM|SECURE)|nodemailer"` over tracked files and getting no matches, and by confirming `backend/.env.example` parses against the `env.ts` schema (a startup with those values and `MAIL_TRANSPORT=log` succeeds).

- [x] 1.6 Rewrite section 3 of `docs/post-deploy-verification-auth-oauth-otp.md`, which currently forces a failure by setting `SMTP_PORT=1`: force it by setting `RESEND_API_KEY` to a wrong value, expect `502 delivery_failed` within about 10 seconds, restore the key, then confirm the earlier code still verifies. Update the cleanup checklist accordingly. Verify no `SMTP_` reference remains in `docs/`.

- [x] 1.7 Update `README.md` to describe the Resend mail delivery: remove every Nodemailer, Gmail SMTP, and Gmail App Password reference; document `RESEND_API_KEY`, `EMAIL_FROM`, and `EMAIL_FROM_NAME`; state that mail is sent through an HTTPS API rather than SMTP; and replace Nodemailer in the tech-stack table. Verify `git grep -nE "nodemailer|Nodemailer|Gmail|App Password|SMTP" -- README.md` returns no matches.

## 2. OTP lifecycle and signup responses

- [x] 2.1 Rework `issueOtp` in `backend/src/services/otp.ts` to accept a delivery callback and use the write → send → reconcile order: keep the cooldown and hourly-cap checks first, insert the new row, `await` the delivery, delete the new row and rethrow on failure, then consume every other unconsumed row for that address and purpose on success. No schema change. Verify with database tests: a throwing delivery leaves the previously issued code verifiable, starts no new cooldown, and leaves the hourly count unchanged; a successful delivery consumes the previous code; a second successful delivery within the cooldown still returns the cooldown error.

- [x] 2.2 In `backend/src/routes/auth.ts`, map `POST /signup/request-otp` to four distinguishable outcomes: `409 email_taken` when `isEmailTaken` matches (no code issued, no mail sent), `502 delivery_failed` on `MailDeliveryError`, re-thrown `AppError` so the cooldown and hourly cap answer `429 rate_limited` with `Retry-After`, and `200 {sent:true}` only on a confirmed delivery. Verify with integration tests asserting all four statuses, no `Set-Cookie` on any failure, the shared error envelope shape, and that a 429 sends no email (`testOutbox` unchanged).

- [x] 2.3 Apply the same `409`/`429`/`502` mapping to `POST /password/forgot` so the two OTP-issuing endpoints cannot be compared against each other, per design D7. Verify with the mirrored tests from 2.2 against the reset path.

## 3. Web client: deadline, outcomes, batch field

- [x] 3.1 In `frontend/src/lib/api.ts`, give `apiFetch` an optional `timeoutMs` defaulting to `15_000` and abort with `AbortSignal.any([...])`, inserting the caller's signal only when one was supplied. Convert a timeout or abort into a distinct, human-readable message instead of `Request failed (<status>)`. Verify with `npm run lint` and `npm run build` in `frontend/`, and by pointing `API_ORIGIN` at an unroutable host and confirming the signup form shows the timeout message within about 15 seconds instead of spinning.

- [x] 3.2 In `frontend/src/app/(auth)/signup/page.tsx`, delete `BATCHES`, the `<datalist>`, and `list=`, change the placeholder to `e.g. 2027`, adjust the hint to say the value is optional and used for account recovery, and remove `hscBatch` from the client-side required checks. Render the three failure outcomes distinctly: `email_taken` (state it is registered, point at sign-in), `rate_limited` (say when another request is possible, do not start a local resend countdown), and `delivery_failed` (retryable message, stay on step 1). Verify with `npm run lint && npm run build` in `frontend/` and a manual walkthrough of the four outcomes.

- [x] 3.3 In `frontend/src/app/(auth)/forgot-email/page.tsx`, apply the same batch-field change: delete `BATCHES`, the `<datalist>`, and `list=`, and use the `e.g. 2027` placeholder. The field stays required here because it is the recovery lookup key. Verify with `npm run lint && npm run build` and a manual check that both forms show the same placeholder and offer no list.

- [x] 3.4 Add `API_ORIGIN=http://localhost:4000` to `frontend/.env.local` so local development stops proxying to production. Verify by requesting `http://localhost:3000/api/v2/health` and confirming the response no longer carries `x-render-origin-server: Render` and resolves in tens of milliseconds.

## 4. Integration verification

- [x] 4.1 Run `npm run lint && npm test` in `backend/` against the disposable database and `npm run lint && npm run build` in `frontend/`; record the commands and their output.

- [x] 4.2 Walk the signup flow end-to-end locally with `MAIL_TRANSPORT=log`: request a code and read it from the server log, verify it, complete the password step, and confirm the created account exists with an empty `hsc_batch` when the field was left blank.

- [x] 4.3 Run `openspec validate fix-signup-mail-delivery --strict` and confirm it passes.

## 5. Production rollout

- [ ] 5.1 In the Render dashboard for `dcitc-api` (not only `render.yaml`): add `RESEND_API_KEY`, `EMAIL_FROM`, `EMAIL_FROM_NAME`; delete `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_SECURE`, `SMTP_FROM`; confirm the service reaches **Live** and `/api/v2/health` answers 200.

- [ ] 5.2 Verify on `https://www.dcitc.org`: a signup code arrives in an inbox for a fresh address within seconds, the contact form delivers its notification, and a forced failure (wrong `RESEND_API_KEY`) returns `502 delivery_failed` in about 10 seconds rather than hanging. Restore the key afterwards and re-confirm delivery.

## 6. Reconcile the in-flight change

- [x] 6.1 Reconcile `openspec/changes/fix-auth-oauth-otp-rate-limits/tasks.md`: tasks 2.1 and 2.2 describe a delivery ordering and a cooldown response that this change replaces, yet they are marked done while the tree does not contain them. Mark them superseded and point at this change, or archive that change as superseded. Verify `openspec validate fix-auth-oauth-otp-rate-limits` still passes and no task in either change claims contradictory behaviour.

## Workflow follow-up

- Archive `fix-signup-mail-delivery` after review and after the manual production checks in 5.1–5.2.
- Confirm the archived delta landed under `openspec/specs/{email-delivery,user-auth,auth-experience}/`.
