"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import AuthCard from "@/components/auth/AuthCard";
import Alert from "@/components/ui/Alert";
import Button from "@/components/ui/Button";
import OtpInput from "@/components/ui/OtpInput";
import PasswordField from "@/components/ui/PasswordField";
import StepIndicator from "@/components/ui/StepIndicator";
import TextField from "@/components/ui/TextField";
import { apiFetch } from "@/lib/api";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [resendIn, setResendIn] = useState(0);

  useEffect(() => {
    if (resendIn <= 0) return;
    const timer = window.setInterval(
      () => setResendIn((value) => (value > 0 ? value - 1 : 0)),
      1000
    );
    return () => window.clearInterval(timer);
  }, [resendIn]);

  /** One mapping for the first request and every resend, so neither can lie. */
  function outcomeFor(err: unknown): { message: string; advance: boolean } {
    const apiError = err as {
      code?: string;
      message?: string;
      retryAfter?: number;
    };
    switch (apiError?.code) {
      case "email_not_found":
        return {
          message:
            "No account uses that email. Check the address or create an account.",
          advance: false,
        };
      case "rate_limited": {
        const wait = apiError.retryAfter ?? 60;
        return {
          message: `Too many requests. Try again in ${wait} second${wait === 1 ? "" : "s"}.`,
          advance: false,
        };
      }
      case "delivery_failed":
        return {
          message:
            "We couldn't send the code right now. Please try again in a moment.",
          advance: false,
        };
      default:
        return {
          message:
            apiError?.message ||
            "We could not send a reset code. Please try again.",
          advance: false,
        };
    }
  }

  async function requestCode(event: React.FormEvent) {
    event.preventDefault();
    if (pending) return;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setFieldErrors({ email: "Enter a valid email address." });
      return;
    }
    setPending(true);
    setError("");
    setFieldErrors({});
    try {
      await apiFetch("/auth/password/forgot", {
        method: "POST",
        body: { email: email.trim() },
      });
      setNotice(
        `If ${email.trim()} matches an account, a six-digit reset code is on its way.`
      );
      setStep(2);
      setResendIn(60);
    } catch (err) {
      setError(outcomeFor(err).message);
    } finally {
      setPending(false);
    }
  }

  async function resend() {
    if (resendIn > 0 || pending) return;
    setPending(true);
    setError("");
    try {
      await apiFetch("/auth/password/forgot", {
        method: "POST",
        body: { email: email.trim() },
      });
      setCode("");
      setResendIn(60);
      setNotice("A fresh reset code is on its way.");
    } catch (err) {
      // Never claim success: keep the entered code and leave the control ready.
      setNotice("");
      setError(outcomeFor(err).message);
    } finally {
      setPending(false);
    }
  }

  async function reset(event: React.FormEvent) {
    event.preventDefault();
    if (pending) return;
    const nextErrors: Record<string, string> = {};
    if (code.length !== 6) nextErrors.code = "Enter the six-digit code.";
    if (password.length < 8)
      nextErrors.password = "Use at least 8 characters.";
    if (confirm !== password)
      nextErrors.confirm = "Passwords do not match.";
    setFieldErrors(nextErrors);
    setError("");
    if (Object.keys(nextErrors).length > 0) return;

    setPending(true);
    try {
      await apiFetch("/auth/password/reset", {
        method: "POST",
        body: { email: email.trim(), code, password },
      });
      router.replace("/login?reset=1");
    } catch (err) {
      const apiError = err as {
        code?: string;
        message?: string;
        fields?: Record<string, string>;
      };
      if (
        apiError?.code?.includes("otp") ||
        apiError?.code?.includes("code")
      ) {
        setFieldErrors({
          code: apiError.message || "That code is not valid.",
        });
      } else {
        setError(apiError?.message || "We could not reset the password.");
        if (apiError?.fields) setFieldErrors(apiError.fields);
      }
    } finally {
      setPending(false);
    }
  }

  return (
    <AuthCard
      eyebrow="Account recovery"
      title={step === 1 ? "Reset your password" : "Choose a new password"}
      subtitle={
        step === 1
          ? "Enter the email on your account and we will send a reset code."
          : "Enter the code from your inbox, then set a new password."
      }
    >
      <div className="mb-6">
        <StepIndicator steps={["Email", "Reset"]} current={step} />
      </div>

      {step === 1 ? (
        <form onSubmit={requestCode} className="space-y-4" noValidate>
          {error ? <Alert variant="error">{error}</Alert> : null}
          <TextField
            label="Email"
            type="email"
            name="email"
            inputMode="email"
            autoComplete="email"
            placeholder="you@example.com"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            error={fieldErrors.email}
            autoFocus
            required
          />
          <Button type="submit" fullWidth loading={pending}>
            {pending ? "Sending code" : "Send reset code"}
          </Button>
          <p className="text-center font-rajdhani text-sm text-slate-500">
            Remembered it?{" "}
            <Link
              href="/login"
              className="text-white underline-offset-4 hover:underline"
            >
              Back to sign in
            </Link>
          </p>
        </form>
      ) : (
        <form onSubmit={reset} className="space-y-5" noValidate>
          {notice ? <Alert variant="info">{notice}</Alert> : null}
          {error ? <Alert variant="error">{error}</Alert> : null}

          <OtpInput
            value={code}
            onChange={(value) => {
              setCode(value);
              if (fieldErrors.code) {
                setFieldErrors((current) => ({ ...current, code: "" }));
              }
            }}
            error={fieldErrors.code}
            label="Reset code"
          />

          <PasswordField
            label="New password"
            name="password"
            autoComplete="new-password"
            placeholder="At least 8 characters"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            error={fieldErrors.password}
            hint="Use 8 or more characters."
            required
          />

          <PasswordField
            label="Confirm new password"
            name="confirm"
            autoComplete="new-password"
            placeholder="Repeat your new password"
            value={confirm}
            onChange={(event) => setConfirm(event.target.value)}
            error={fieldErrors.confirm}
            required
          />

          <Button type="submit" fullWidth loading={pending}>
            {pending ? "Updating password" : "Update password"}
          </Button>

          <div className="flex flex-col items-center gap-2 border-t border-white/10 pt-4 text-center">
            <button
              type="button"
              onClick={resend}
              disabled={resendIn > 0 || pending}
              className="font-rajdhani text-sm text-slate-300 underline-offset-4 transition-colors hover:text-white hover:underline disabled:cursor-not-allowed disabled:text-slate-500 disabled:no-underline"
            >
              {resendIn > 0 ? `Resend code in ${resendIn}s` : "Resend code"}
            </button>
            <button
              type="button"
              onClick={() => {
                setStep(1);
                setCode("");
                setNotice("");
                setError("");
                setFieldErrors({});
              }}
              className="font-rajdhani text-sm text-slate-500 underline-offset-4 transition-colors hover:text-white hover:underline"
            >
              Use a different email
            </button>
          </div>
        </form>
      )}
    </AuthCard>
  );
}
