"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import AuthCard from "@/components/auth/AuthCard";
import Alert from "@/components/ui/Alert";
import Button from "@/components/ui/Button";
import GoogleButton from "@/components/ui/GoogleButton";
import OtpInput from "@/components/ui/OtpInput";
import PasswordField from "@/components/ui/PasswordField";
import StepIndicator from "@/components/ui/StepIndicator";
import TextField from "@/components/ui/TextField";
import { apiFetch } from "@/lib/api";

const STEPS = ["Details", "Verify", "Password"];
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type FieldErrors = Record<string, string>;

const EXPIRED_VERIFICATION_CODES = new Set(["unauthenticated", "otp_expired"]);

function isExpiredVerification(code: string | undefined): boolean {
  if (!code) return false;
  return (
    EXPIRED_VERIFICATION_CODES.has(code) ||
    code.includes("token") ||
    code.includes("expired")
  );
}

function passwordScore(password: string) {
  if (!password) return 0;
  let score = 0;
  if (password.length >= 8) score += 1;
  if (password.length >= 12) score += 1;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score += 1;
  if (/\d/.test(password) || /[^A-Za-z0-9]/.test(password)) score += 1;
  return score;
}

const strengthLabels = ["Too short", "Weak", "Fair", "Good", "Strong"];

export default function SignupPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [hscBatch, setHscBatch] = useState("");
  const [code, setCode] = useState("");
  const [signupToken, setSignupToken] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [errorCode, setErrorCode] = useState("");
  const [notice, setNotice] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [resendIn, setResendIn] = useState(0);

  const score = useMemo(() => passwordScore(password), [password]);

  /** Back to step one with the verification state cleared, keeping the details. */
  function startOver(message = "") {
    setStep(1);
    setSignupToken("");
    setCode("");
    setPassword("");
    setConfirm("");
    setNotice("");
    setErrorCode("");
    setFieldErrors({});
    setError(message);
  }

  useEffect(() => {
    if (resendIn <= 0) return;
    const timer = window.setInterval(
      () => setResendIn((value) => (value > 0 ? value - 1 : 0)),
      1000
    );
    return () => window.clearInterval(timer);
  }, [resendIn]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        await apiFetch("/auth/me");
        if (!cancelled) router.replace("/dashboard");
      } catch {
        /* not signed in */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [router]);

  async function requestOtp(event: React.FormEvent) {
    event.preventDefault();
    if (pending) return;
    const nextErrors: FieldErrors = {};
    if (!name.trim()) nextErrors.name = "Tell us your full name.";
    if (!EMAIL_PATTERN.test(email.trim()))
      nextErrors.email = "Enter a valid email address.";

    setFieldErrors(nextErrors);
    setError("");
    setErrorCode("");
    if (Object.keys(nextErrors).length > 0) return;

    setPending(true);
    try {
      await apiFetch("/auth/signup/request-otp", {
        method: "POST",
        body: { email: email.trim() },
      });
      setNotice(`We sent a six-digit code to ${email.trim()}.`);
      setStep(2);
      setResendIn(60);
    } catch (err) {
      const apiError = err as {
        code?: string;
        message?: string;
        retryAfter?: number;
      };
      setErrorCode(apiError?.code ?? "");
      if (apiError?.code === "email_taken") {
        setError("That email is already registered.");
      } else if (apiError?.code === "rate_limited") {
        const wait = apiError.retryAfter ?? 60;
        setError(
          `Too many code requests. Try again in ${wait} second${wait === 1 ? "" : "s"}.`
        );
      } else if (apiError?.code === "delivery_failed") {
        setError(
          "We could not send the code right now. Please try again in a moment."
        );
      } else {
        setError(
          apiError?.message || "We could not send a code. Please try again."
        );
      }
    } finally {
      setPending(false);
    }
  }

  async function verifyOtp(event: React.FormEvent) {
    event.preventDefault();
    if (pending) return;
    if (code.length !== 6) {
      setFieldErrors({ code: "Enter the six-digit code." });
      return;
    }
    setPending(true);
    setError("");
    setFieldErrors({});
    try {
      const data = await apiFetch<{ signupToken: string }>(
        "/auth/signup/verify-otp",
        { method: "POST", body: { email: email.trim(), code } }
      );
      setSignupToken(data.signupToken);
      setNotice("");
      setStep(3);
    } catch (err) {
      const apiError = err as { code?: string; message?: string };
      if (apiError?.code === "otp_expired") {
        setFieldErrors({ code: "That code expired. Request a new one." });
      } else if (apiError?.code === "otp_exhausted") {
        setFieldErrors({
          code: "Too many attempts. Request a new code.",
        });
      } else {
        setFieldErrors({
          code: apiError?.message || "That code is not valid.",
        });
      }
    } finally {
      setPending(false);
    }
  }

  async function resend() {
    if (resendIn > 0 || pending) return;
    setPending(true);
    setError("");
    try {
      await apiFetch("/auth/signup/request-otp", {
        method: "POST",
        body: { email: email.trim() },
      });
      setCode("");
      setFieldErrors({});
      setNotice("A fresh code is on its way.");
      setResendIn(60);
    } catch (err) {
      const apiError = err as { message?: string };
      setError(apiError?.message || "Could not resend the code.");
    } finally {
      setPending(false);
    }
  }

  async function complete(event: React.FormEvent) {
    event.preventDefault();
    if (pending) return;
    const nextErrors: FieldErrors = {};
    if (password.length < 8)
      nextErrors.password = "Use at least 8 characters.";
    if (confirm !== password)
      nextErrors.confirm = "Passwords do not match.";
    setFieldErrors(nextErrors);
    setError("");
    if (Object.keys(nextErrors).length > 0) return;

    setPending(true);
    try {
      await apiFetch("/auth/signup/complete", {
        method: "POST",
        body: {
          signupToken,
          name: name.trim(),
          hscBatch: hscBatch.trim(),
          password,
        },
      });
      router.replace("/dashboard");
    } catch (err) {
      const apiError = err as {
        message?: string;
        fields?: FieldErrors;
        code?: string;
      };
      if (isExpiredVerification(apiError?.code)) {
        // `complete` answers `unauthenticated` for an expired token, so match it
        // alongside any token-ish code instead of leaving a dead end.
        startOver("Your verification expired. Request a new code.");
      } else if (apiError?.code === "email_taken") {
        setStep(1);
        setError("That email is already registered. Try signing in instead.");
      } else {
        setError(apiError?.message || "We could not create your account.");
        if (apiError?.fields) setFieldErrors(apiError.fields);
      }
    } finally {
      setPending(false);
    }
  }

  const titles: Record<number, { title: string; subtitle: string }> = {
    1: {
      title: "Join DCITC",
      subtitle:
        "Start with your details. We will verify your email, then you set a password.",
    },
    2: {
      title: "Check your inbox",
      subtitle: "Enter the six-digit code we just sent to confirm it is you.",
    },
    3: {
      title: "Set a password",
      subtitle: "Last step. Choose something you will remember.",
    },
  };

  return (
    <AuthCard
      eyebrow={`Membership / step ${step} of 3`}
      title={titles[step].title}
      subtitle={titles[step].subtitle}
    >
      <div className="mb-6">
        <StepIndicator steps={STEPS} current={step} />
      </div>

      {step === 1 ? (
        <>
          <GoogleButton label="Continue with Google" />
          <p className="mb-4 mt-2 text-center type-caption tracking-wide text-faint">
            Already have a Google account? Skip the code.
          </p>

          <div className="my-5 flex items-center gap-3" aria-hidden="true">
            <span className="h-px flex-1 bg-surface-2" />
            <span className="type-overline uppercase tracking-[0.24em] text-faint">
              or use email
            </span>
            <span className="h-px flex-1 bg-surface-2" />
          </div>

          <form onSubmit={requestOtp} className="space-y-4" noValidate>
            {error ? (
              <Alert variant="error">
                {error}
                {errorCode === "email_taken" ? (
                  <>
                    {" "}
                    <Link
                      href="/login"
                      className="font-semibold text-text underline underline-offset-4"
                    >
                      Sign in instead
                    </Link>
                    .
                  </>
                ) : null}
              </Alert>
            ) : null}

            <TextField
              label="Full name"
              name="name"
              autoComplete="name"
              placeholder="Your full name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              error={fieldErrors.name}
              autoFocus
              required
            />

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
              required
            />

            <TextField
              label="HSC batch (optional)"
              name="hscBatch"
              placeholder="e.g. 2027"
              autoComplete="off"
              value={hscBatch}
              onChange={(event) => setHscBatch(event.target.value)}
              error={fieldErrors.hscBatch}
              hint="Optional. Used to find your account if you forget your email."
            />

            <Button type="submit" fullWidth loading={pending} className="mt-2">
              {pending ? "Sending code" : "Continue"}
            </Button>
          </form>

          <p className="mt-6 border-t border-line pt-5 text-center type-body-sm text-faint">
            Already a member?{" "}
            <Link
              href="/login"
              className="font-semibold text-text underline-offset-4 transition-colors hover:underline"
            >
              Sign in
            </Link>
          </p>
        </>
      ) : null}

      {step === 2 ? (
        <form onSubmit={verifyOtp} className="space-y-5" noValidate>
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
          />

          <Button type="submit" fullWidth loading={pending}>
            {pending ? "Verifying" : "Verify email"}
          </Button>

          <div className="flex flex-col items-center gap-2 border-t border-line pt-4 text-center">
            <button
              type="button"
              onClick={resend}
              disabled={resendIn > 0 || pending}
              className="type-body-sm text-muted underline-offset-4 transition-colors hover:text-text hover:underline disabled:cursor-not-allowed disabled:text-faint disabled:no-underline"
            >
              {resendIn > 0
                ? `Resend code in ${resendIn}s`
                : "Resend code"}
            </button>
            <button
              type="button"
              onClick={() => {
                setStep(1);
                setCode("");
                setNotice("");
                setError("");
                setErrorCode("");
                setFieldErrors({});
              }}
              className="type-body-sm text-faint underline-offset-4 transition-colors hover:text-text hover:underline"
            >
              Use a different email
            </button>
          </div>
        </form>
      ) : null}

      {step === 3 ? (
        <form onSubmit={complete} className="space-y-4" noValidate>
          {error ? <Alert variant="error">{error}</Alert> : null}

          <div>
            <PasswordField
              label="New password"
              name="password"
              autoComplete="new-password"
              placeholder="At least 8 characters"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              error={fieldErrors.password}
              autoFocus
              required
            />
            <div className="mt-2">
              <div className="flex gap-1" aria-hidden="true">
                {[0, 1, 2, 3].map((index) => (
                  <span
                    key={index}
                    className={`h-1 flex-1 transition-colors ${
                      index < score
                        ? score >= 4
                          ? "bg-success"
                          : score >= 3
                            ? "bg-warning"
                            : "bg-danger"
                        : "bg-surface-2"
                    }`}
                  />
                ))}
              </div>
              <div className="mt-1.5 flex items-center justify-between type-caption">
                <span className="text-faint">
                  Use 8 or more characters.
                </span>
                <span className="text-subtle">
                  {password ? strengthLabels[score] : ""}
                </span>
              </div>
            </div>
          </div>

          <PasswordField
            label="Confirm password"
            name="confirm"
            autoComplete="new-password"
            placeholder="Repeat your password"
            value={confirm}
            onChange={(event) => setConfirm(event.target.value)}
            error={fieldErrors.confirm}
            required
          />

          <Button type="submit" fullWidth loading={pending} className="mt-2">
            {pending ? "Creating account" : "Create account"}
          </Button>

          <div className="flex flex-col items-center gap-2 border-t border-line pt-4 text-center">
            <button
              type="button"
              onClick={() => startOver()}
              className="type-body-sm text-faint underline-offset-4 transition-colors hover:text-text hover:underline"
            >
              Start over
            </button>
          </div>
        </form>
      ) : null}
    </AuthCard>
  );
}
