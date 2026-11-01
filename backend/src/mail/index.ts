import { createHash } from "node:crypto";
import { env } from "../config/env.js";

export type MailMessage = {
  to: string;
  subject: string;
  text: string;
  html: string;
  replyTo?: string;
};

export class MailDeliveryError extends Error {
  constructor() {
    super("mail_delivery_failed");
    this.name = "MailDeliveryError";
  }
}

/** Test-only outbox. Never exported over HTTP and never populated in production. */
export const testOutbox: MailMessage[] = [];

const RESEND_ENDPOINT = "https://api.resend.com/emails";
const REQUEST_TIMEOUT_MS = 10_000;

function fromAddress(): string {
  const address = env.EMAIL_FROM ?? "";
  return env.EMAIL_FROM_NAME ? `${env.EMAIL_FROM_NAME} <${address}>` : address;
}

function idempotencyKey(operation: string, message: MailMessage): string {
  return createHash("sha256")
    .update([operation, message.to, message.subject, message.text].join("|"))
    .digest("hex");
}

function logFailure(operation: string, detail: Record<string, unknown>): void {
  // Only the operation and failure class: never the key, recipient, or message body.
  console.error(JSON.stringify({ level: "error", message: "mail_delivery_failed", operation, ...detail }));
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function headerSafe(value: string): string {
  return value.replace(/[\r\n]+/g, " ").trim();
}

async function deliver(message: MailMessage, operation: string): Promise<void> {
  const safe: MailMessage = {
    ...message,
    to: headerSafe(message.to),
    subject: headerSafe(message.subject),
    ...(message.replyTo ? { replyTo: headerSafe(message.replyTo) } : {}),
  };

  if (env.MAIL_TRANSPORT === "log") {
    // Dev/test transport: prints the message instead of sending it, so the OTP is visible locally.
    console.log(
      JSON.stringify({ level: "info", message: "mail_log_transport", operation, to: safe.to, subject: safe.subject }),
    );
    console.log(`--- ${safe.subject} ---\n${safe.text}\n---`);
    if (env.NODE_ENV === "test") testOutbox.push(safe);
    return;
  }

  try {
    const response = await fetch(RESEND_ENDPOINT, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
        "Idempotency-Key": idempotencyKey(operation, safe),
      },
      body: JSON.stringify({
        from: fromAddress(),
        to: safe.to,
        subject: safe.subject,
        text: safe.text,
        html: safe.html,
        ...(safe.replyTo ? { reply_to: safe.replyTo } : {}),
      }),
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });

    if (!response.ok) {
      logFailure(operation, { status: response.status });
      throw new MailDeliveryError();
    }
  } catch (error) {
    if (error instanceof MailDeliveryError) throw error;
    logFailure(operation, { name: error instanceof Error ? error.name : "unknown" });
    throw new MailDeliveryError();
  }

  if (env.NODE_ENV === "test") testOutbox.push(safe);
}

/**
 * Contact notifications stay on the plain `layout()` shell: the recipient is an
 * internal club inbox, there is no brand audience, and the message is a raw
 * form paste. Every user-facing message uses `emailDocument` below.
 */
const layout = (heading: string, body: string) =>
  `<div style="font-family:system-ui,sans-serif;line-height:1.5"><h2>${heading}</h2>${body}</div>`;

const CLUB_NAME = "Dhaka College Information & Technology Club";
const CLUB_URL = "https://www.dcitc.org";
const LOGO_URL = `${CLUB_URL}/logo.png`;

const SANS =
  "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif";
const MONO = "ui-monospace,SFMono-Regular,Menlo,Consolas,'Liberation Mono',monospace";

/**
 * One client-safe document for every user-facing transactional message.
 *
 * Inline styles carry the light rendering, so a client that strips `<head>`
 * still gets the intended hierarchy. The `style` block adds an explicit dark
 * variant for clients that honour `prefers-color-scheme` (and the Outlook
 * `[data-ogsc]`/`[data-ogsb]` hooks). Pixel-identical output across clients is
 * not achievable; readable and intentional in both is the bar.
 */
export function emailDocument(opts: {
  preheader: string;
  heading: string;
  intro: string;
  body: string;
}): string {
  const darkRules = (scope: string) => `
    ${scope}.dc-page { background-color:#0a0a0a !important; }
    ${scope}.dc-card { background-color:#141414 !important; border-color:#27272a !important; }
    ${scope}.dc-ink { color:#fafafa !important; }
    ${scope}.dc-muted { color:#a1a1aa !important; }
    ${scope}.dc-border { border-color:#27272a !important; }
    ${scope}.dc-accent { color:#fb923c !important; }
    ${scope}.dc-code { background-color:#000000 !important; border-color:#3f3f46 !important; color:#fafafa !important; }
    ${scope}.dc-divider { border-color:#27272a !important; }
  `;

  return `<!doctype html>
<html lang="en" style="color-scheme:light dark;">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="color-scheme" content="light dark">
<meta name="supported-color-schemes" content="light dark">
<title>${escapeHtml(opts.heading)}</title>
<style>
  :root { color-scheme: light dark; supported-color-schemes: light dark; }
  @media (prefers-color-scheme: dark) { ${darkRules("")} }
  ${darkRules("[data-ogsc] ")}
  ${darkRules("[data-ogsb] ")}
</style>
</head>
<body class="dc-page" style="margin:0;padding:0;background-color:#f4f4f5;">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;mso-hide:all;">${escapeHtml(opts.preheader)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" class="dc-page" style="background-color:#f4f4f5;">
<tr>
<td align="center" style="padding:24px 12px;">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:600px;">
<tr>
<td style="background-color:#0a0a0a;padding:20px 24px;">
<table role="presentation" cellpadding="0" cellspacing="0" border="0">
<tr>
<td style="padding:0 12px 0 0;vertical-align:middle;">
<img src="${LOGO_URL}" width="48" height="48" alt="${CLUB_NAME}" style="display:block;border:0;width:48px;height:48px;">
</td>
<td style="vertical-align:middle;">
<span style="font:700 13px/1.4 ${SANS};letter-spacing:2px;text-transform:uppercase;color:#ffffff;">DCITC</span><br>
<span style="font:400 11px/1.5 ${SANS};color:#a1a1aa;">${CLUB_NAME}</span>
</td>
</tr>
</table>
</td>
</tr>
<tr>
<td class="dc-card" style="background-color:#ffffff;border:1px solid #e4e4e7;border-top:0;padding:32px 28px;">
<h1 class="dc-ink" style="margin:0 0 12px;font:700 22px/1.3 ${SANS};color:#0a0a0a;">${escapeHtml(opts.heading)}</h1>
<p class="dc-muted" style="margin:0 0 24px;font:400 14px/1.6 ${SANS};color:#52525b;">${escapeHtml(opts.intro)}</p>
${opts.body}
</td>
</tr>
<tr>
<td style="padding:18px 8px;text-align:center;">
<p class="dc-muted" style="margin:0;font:400 12px/1.6 ${SANS};color:#52525b;">
${CLUB_NAME} ·
<a class="dc-accent" href="${CLUB_URL}" style="color:#ea580c;text-decoration:none;">www.dcitc.org</a>
</p>
<p class="dc-muted" style="margin:6px 0 0;font:400 11px/1.6 ${SANS};color:#52525b;">
You received this because someone used this address on ${CLUB_URL}.
</p>
</td>
</tr>
</table>
</td>
</tr>
</table>
</body>
</html>`;
}

/** Builds the transactional OTP mail without touching a transport, so it can be tested. */
export function renderOtpEmail(
  kind: "signup" | "password_reset",
  code: string,
): { subject: string; text: string; html: string } {
  const isSignup = kind === "signup";
  const subject = isSignup ? "DCITC signup code" : "DCITC password reset code";
  const heading = isSignup ? "Confirm your DCITC account" : "Reset your DCITC password";
  const intro = isSignup
    ? "Use this code to verify your email address."
    : "Use this code to choose a new password.";

  const text = [
    CLUB_NAME,
    "",
    intro,
    "",
    `Your verification code: ${code}`,
    "",
    "This code expires in 10 minutes.",
    "If you didn't request this, you can ignore this email.",
  ].join("\n");

  const body =
    `<div class="dc-code" style="margin:0 0 12px;padding:20px 12px;border:1px solid #e4e4e7;background-color:#fafafa;text-align:center;font:700 36px/1.2 ${MONO};letter-spacing:10px;color:#0a0a0a;word-break:break-all;">${escapeHtml(code)}</div>` +
    `<p class="dc-muted" style="margin:0 0 20px;font:400 13px/1.6 ${SANS};color:#52525b;">Select the code above to copy it.</p>` +
    `<p class="dc-muted" style="margin:0 0 8px;font:400 13px/1.6 ${SANS};color:#52525b;">This code expires in <strong class="dc-ink" style="color:#0a0a0a;">10 minutes</strong>.</p>` +
    `<p class="dc-muted dc-divider" style="margin:20px 0 0;padding-top:16px;border-top:1px solid #e4e4e7;font:400 12px/1.6 ${SANS};color:#52525b;">If you didn&#39;t request this, you can ignore this email.</p>`;

  const html = emailDocument({
    preheader: `${intro} The code expires in 10 minutes.`,
    heading,
    intro,
    body,
  });

  return { subject, text, html };
}

export async function sendSignupOtp(to: string, code: string): Promise<void> {
  const { subject, text, html } = renderOtpEmail("signup", code);
  await deliver({ to, subject, text, html }, "signup_otp");
}

export async function sendResetOtp(to: string, code: string): Promise<void> {
  const { subject, text, html } = renderOtpEmail("password_reset", code);
  await deliver({ to, subject, text, html }, "reset_otp");
}

/** Routes pass these into `issueOtp`; tests replace them to simulate delivery failure. */
export const otpSenders = {
  signup: sendSignupOtp,
  reset: sendResetOtp,
};

export async function sendEmailRecovery(to: string, name: string): Promise<void> {
  const intro = "This address is the one registered to your DCITC account.";
  await deliver(
    {
      to,
      subject: "Your DCITC account email",
      text: `Hello ${name}, this address is the one registered to your DCITC account.`,
      html: emailDocument({
        preheader: intro,
        heading: "Your DCITC account",
        intro,
        body: `<p class="dc-ink" style="margin:0;font:400 14px/1.6 ${SANS};color:#0a0a0a;">Hello ${escapeHtml(name)}, this is the address registered to your DCITC account.</p>`,
      }),
    },
    "email_recovery",
  );
}

export async function sendContactNotification(input: {
  name: string;
  email: string;
  message: string;
}): Promise<void> {
  const name = headerSafe(input.name);
  const email = headerSafe(input.email);
  await deliver(
    {
      to: env.CONTACT_TO,
      replyTo: email,
      subject: "Website contact message",
      text: `From: ${name} <${email}>\n\n${input.message}`,
      html: layout(
        "Website contact message",
        `<p><strong>From:</strong> ${escapeHtml(name)} &lt;${escapeHtml(email)}&gt;</p><p style="white-space:pre-wrap">${escapeHtml(input.message)}</p>`,
      ),
    },
    "contact_notification",
  );
}
