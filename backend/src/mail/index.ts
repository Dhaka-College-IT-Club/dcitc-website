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

const layout = (heading: string, body: string) =>
  `<div style="font-family:system-ui,sans-serif;line-height:1.5"><h2>${heading}</h2>${body}</div>`;

const CLUB_NAME = "Dhaka College Information & Technology Club";

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

  const html =
    `<div style="margin:0;padding:24px;background:#0b0b0b;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#e5e7eb">` +
    `<div style="max-width:480px;margin:0 auto;padding:32px;background:#111111;border:1px solid #262626">` +
    `<p style="margin:0 0 24px;font-size:12px;letter-spacing:2px;text-transform:uppercase;color:#9ca3af">${CLUB_NAME}</p>` +
    `<h1 style="margin:0 0 12px;font-size:22px;line-height:1.3;color:#ffffff">${heading}</h1>` +
    `<p style="margin:0 0 24px;font-size:14px;line-height:1.6;color:#9ca3af">${intro}</p>` +
    `<div style="margin:0 0 24px;padding:18px 12px;border:1px solid #333333;background:#000000;text-align:center;font-size:32px;font-weight:700;letter-spacing:8px;color:#ffffff">${escapeHtml(code)}</div>` +
    `<p style="margin:0 0 8px;font-size:13px;line-height:1.6;color:#9ca3af">This code expires in <strong style="color:#e5e7eb">10 minutes</strong>.</p>` +
    `<p style="margin:0;font-size:12px;line-height:1.6;color:#6b7280">If you didn&#39;t request this, you can ignore this email.</p>` +
    `</div></div>`;

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
  await deliver(
    {
      to,
      subject: "Your DCITC account email",
      text: `Hello ${name}, this address is the one registered to your DCITC account.`,
      html: layout("Your DCITC account", `<p>Hello ${escapeHtml(name)}, this is the address registered to your DCITC account.</p>`),
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
