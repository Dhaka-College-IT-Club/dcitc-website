"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import AuthShell from "@/components/auth/AuthShell";
import Field from "@/components/auth/Field";
import SubmitButton from "@/components/auth/SubmitButton";
import { apiFetch } from "@/lib/api";

export default function SignupPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [signupToken, setSignupToken] = useState("");
  const [name, setName] = useState("");
  const [hscBatch, setHscBatch] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [resendIn, setResendIn] = useState(0);

  useEffect(() => {
    if (resendIn <= 0) return;
    const t = setInterval(() => setResendIn((s) => (s > 0 ? s - 1 : 0)), 1000);
    return () => clearInterval(t);
  }, [resendIn]);

  useEffect(() => {
    (async () => {
      try {
        await apiFetch("/auth/me");
        router.replace("/dashboard");
      } catch {
        /* not signed in */
      }
    })();
  }, [router]);

  async function requestOtp(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    setError("");
    setFieldErrors({});
    try {
      await apiFetch("/auth/signup/request-otp", { method: "POST", body: { email } });
      setStep(2);
      setResendIn(60);
    } catch (err) {
      const e2 = err as { message?: string };
      setError(e2?.message || "Failed to send OTP");
    } finally {
      setPending(false);
    }
  }

  async function verifyOtp(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    setError("");
    setFieldErrors({});
    try {
      const data = await apiFetch<{ signupToken: string }>("/auth/signup/verify-otp", {
        method: "POST",
        body: { email, code },
      });
      setSignupToken(data.signupToken);
      setStep(3);
    } catch (err) {
      const e2 = err as { code?: string; message?: string };
      if (e2?.code === "otp_expired") setError("Code expired");
      else if (e2?.code === "otp_exhausted") setError("Too many attempts");
      else setError(e2?.message || "Invalid code");
    } finally {
      setPending(false);
    }
  }

  async function resend() {
    if (resendIn > 0) return;
    setPending(true);
    setError("");
    try {
      await apiFetch("/auth/signup/request-otp", { method: "POST", body: { email } });
      setResendIn(60);
    } catch (err) {
      const e2 = err as { message?: string };
      setError(e2?.message || "Failed to resend");
    } finally {
      setPending(false);
    }
  }

  async function complete(e: React.FormEvent) {
    e.preventDefault();
    if (password !== confirm) {
      setFieldErrors({ confirm: "Passwords do not match" });
      return;
    }
    setPending(true);
    setError("");
    setFieldErrors({});
    try {
      await apiFetch("/auth/signup/complete", {
        method: "POST",
        body: { signupToken, name, hscBatch, password },
      });
      router.replace("/dashboard");
    } catch (err) {
      const e2 = err as { message?: string; fields?: Record<string, string>; code?: string };
      setError(e2?.message || "Failed to create account");
      if (e2?.fields) setFieldErrors(e2.fields);
      if (e2?.code === "email_taken") setError("Email already taken");
    } finally {
      setPending(false);
    }
  }

  if (step === 1) {
    return (
      <AuthShell title="Create account">
        <form onSubmit={requestOtp} className="space-y-4">
          <Field
            label="Email"
            type="email"
            name="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            error={fieldErrors.email}
            required
          />
          {error && <p className="text-sm text-red-400">{error}</p>}
          <SubmitButton pending={pending}>Send code</SubmitButton>
        </form>
      </AuthShell>
    );
  }

  if (step === 2) {
    return (
      <AuthShell title="Verify email">
        <form onSubmit={verifyOtp} className="space-y-4">
          <p className="text-sm text-slate-400">Enter the 6-digit code sent to {email}.</p>
          <Field
            label="Code"
            name="code"
            inputMode="numeric"
            maxLength={6}
            value={code}
            onChange={(e) => setCode(e.target.value)}
            error={fieldErrors.code}
            required
          />
          {error && <p className="text-sm text-red-400">{error}</p>}
          <SubmitButton pending={pending}>Verify</SubmitButton>
          <button
            type="button"
            onClick={resend}
            disabled={resendIn > 0 || pending}
            className="w-full text-sm text-slate-400 disabled:opacity-50"
          >
            {resendIn > 0 ? `Resend in ${resendIn}s` : "Resend code"}
          </button>
        </form>
      </AuthShell>
    );
  }

  return (
    <AuthShell title="Complete profile">
      <form onSubmit={complete} className="space-y-4">
        <Field
          label="Name"
          name="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          error={fieldErrors.name}
          required
        />
        <div className="space-y-1">
          <label className="block text-sm text-slate-300">HSC Batch</label>
          <input
            list="batches"
            name="hscBatch"
            value={hscBatch}
            onChange={(e) => setHscBatch(e.target.value)}
            className="w-full rounded border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100"
          />
          <datalist id="batches">
            {["DC-27", "DC-26", "DC-25"].map((b) => (
              <option key={b} value={b} />
            ))}
          </datalist>
        </div>
        <Field
          label="Password"
          type="password"
          name="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          error={fieldErrors.password}
          required
        />
        <Field
          label="Confirm password"
          type="password"
          name="confirm"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          error={fieldErrors.confirm}
          required
        />
        {error && <p className="text-sm text-red-400">{error}</p>}
        <SubmitButton pending={pending}>Create account</SubmitButton>
      </form>
    </AuthShell>
  );
}