"use client";
import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import AuthShell from "@/components/auth/AuthShell";
import Field from "@/components/auth/Field";
import SubmitButton from "@/components/auth/SubmitButton";
import { apiFetch } from "@/lib/api";

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("next") || "/dashboard";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      try {
        await apiFetch("/auth/me");
        router.replace(next);
      } catch {
        /* not signed in */
      }
    })();
  }, [router, next]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    setError("");
    try {
      await apiFetch("/auth/login", { method: "POST", body: { email, password } });
      router.replace(next);
    } catch {
      setError("Invalid credentials");
    } finally {
      setPending(false);
    }
  }

  return (
    <AuthShell title="Login">
      <form onSubmit={submit} className="space-y-4">
        <Field label="Email" type="email" name="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <Field label="Password" type="password" name="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        {error && <p className="text-sm text-red-400">{error}</p>}
        <SubmitButton pending={pending}>Login</SubmitButton>
        <div className="flex justify-between text-sm text-slate-400">
          <a href="/forgot-password" className="hover:text-white">Forgot password?</a>
          <a href="/forgot-email" className="hover:text-white">Forgot email?</a>
        </div>
        <a
          href="/api/v1/auth/google/start"
          className="block w-full text-center rounded border border-slate-700 py-2 text-slate-200 hover:bg-slate-900"
        >
          Continue with Google
        </a>
      </form>
    </AuthShell>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-black text-slate-400">Loading…</div>}>
      <LoginForm />
    </Suspense>
  );
}