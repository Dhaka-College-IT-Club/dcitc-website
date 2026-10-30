"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import AuthShell from "@/components/auth/AuthShell";
import Field from "@/components/auth/Field";
import SubmitButton from "@/components/auth/SubmitButton";
import { apiFetch } from "@/lib/api";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");

  async function requestOtp(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    setError("");
    setInfo("");
    try {
      await apiFetch("/auth/password/forgot", { method: "POST", body: { email } });
      setInfo("If an account exists, a code was sent.");
      setStep(2);
    } catch {
      setInfo("If an account exists, a code was sent.");
      setStep(2);
    } finally {
      setPending(false);
    }
  }

  async function reset(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    setError("");
    try {
      await apiFetch("/auth/password/reset", {
        method: "POST",
        body: { email, code, password },
      });
      router.replace("/login");
    } catch (err) {
      const e2 = err as { message?: string };
      setError(e2?.message || "Reset failed");
    } finally {
      setPending(false);
    }
  }

  if (step === 1) {
    return (
      <AuthShell title="Reset password">
        <form onSubmit={requestOtp} className="space-y-4">
          <Field label="Email" type="email" name="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          {info && <p className="text-sm text-slate-400">{info}</p>}
          {error && <p className="text-sm text-red-400">{error}</p>}
          <SubmitButton pending={pending}>Send code</SubmitButton>
        </form>
      </AuthShell>
    );
  }

  return (
    <AuthShell title="Set new password">
      <form onSubmit={reset} className="space-y-4">
        <Field label="Code" name="code" value={code} onChange={(e) => setCode(e.target.value)} required />
        <Field label="New password" type="password" name="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        {error && <p className="text-sm text-red-400">{error}</p>}
        <SubmitButton pending={pending}>Reset</SubmitButton>
      </form>
    </AuthShell>
  );
}