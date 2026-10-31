import nodemailer, { type Transporter } from "nodemailer";
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

let transporter: Transporter | null = null;

function getTransporter(): Transporter {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: env.SMTP_HOST,
      port: env.SMTP_PORT ?? 587,
      secure: env.SMTP_SECURE ?? false,
      auth: env.SMTP_USER ? { user: env.SMTP_USER, pass: env.SMTP_PASS } : undefined,
    });
  }
  return transporter;
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

  const send = async () => {
    if (env.MAIL_TRANSPORT === "log") {
      // Dev/test transport: prints the message instead of sending it, so the OTP is visible locally.
      console.log(
        JSON.stringify({ level: "info", message: "mail_log_transport", operation, to: safe.to, subject: safe.subject }),
      );
      console.log(`--- ${safe.subject} ---\n${safe.text}\n---`);
      return;
    }
    await getTransporter().sendMail({
      from: env.SMTP_FROM,
      to: safe.to,
      subject: safe.subject,
      text: safe.text,
      html: safe.html,
      ...(safe.replyTo ? { replyTo: safe.replyTo } : {}),
    });
  };

  try {
    await send();
  } catch {
    // One retry, then a generic failure that never leaks SMTP text.
    try {
      await send();
    } catch {
      console.error(JSON.stringify({ level: "error", message: "mail_delivery_failed", operation }));
      throw new MailDeliveryError();
    }
  }

  if (env.NODE_ENV === "test") testOutbox.push(safe);
}

const layout = (heading: string, body: string) =>
  `<div style="font-family:system-ui,sans-serif;line-height:1.5"><h2>${heading}</h2>${body}</div>`;

export async function sendSignupOtp(to: string, code: string): Promise<void> {
  await deliver(
    {
      to,
      subject: "DCITC signup code",
      text: `Your DCITC signup code is ${code}. It expires in 10 minutes.`,
      html: layout("Confirm your DCITC account", `<p>Your signup code is <strong>${escapeHtml(code)}</strong>.</p><p>It expires in 10 minutes.</p>`),
    },
    "signup_otp",
  );
}

export async function sendResetOtp(to: string, code: string): Promise<void> {
  await deliver(
    {
      to,
      subject: "DCITC password reset code",
      text: `Your DCITC password reset code is ${code}. It expires in 10 minutes.`,
      html: layout("Reset your DCITC password", `<p>Your reset code is <strong>${escapeHtml(code)}</strong>.</p><p>It expires in 10 minutes.</p>`),
    },
    "reset_otp",
  );
}

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
