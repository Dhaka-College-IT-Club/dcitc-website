"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import AuthCard from "@/components/auth/AuthCard";
import Alert from "@/components/ui/Alert";
import Button from "@/components/ui/Button";
import GoogleButton from "@/components/ui/GoogleButton";
import PasswordField from "@/components/ui/PasswordField";
import TextField from "@/components/ui/TextField";
import { apiFetch } from "@/lib/api";

function safeNext(value: string | null) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return "/dashboard";
  }
  return value;
}

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const next = safeNext(params.get("next"));
  const oauthError = params.get("error");
  const resetDone = params.get("reset") === "1";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState(
    oauthError
      ? "Google sign-in did not complete. Please try again or use your email."
      : ""
  );

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        await apiFetch("/auth/me");
        if (!cancelled) router.replace(next);
      } catch {
        /* not signed in */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [router, next]);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (pending) return;
    setPending(true);
    setError("");
    try {
      await apiFetch("/auth/login", {
        method: "POST",
        body: { email, password },
      });
      router.replace(next);
    } catch (err) {
      const apiError = err as { status?: number; message?: string };
      setError(
        apiError?.status === 401 || !apiError?.message
          ? "Invalid email or password."
          : apiError.message
      );
    } finally {
      setPending(false);
    }
  }

  return (
    <AuthCard
      eyebrow="Member access"
      title="Welcome back"
      subtitle="Sign in to reach your member dashboard, membership card, and club updates."
    >
      {resetDone ? (
        <div className="mb-4">
          <Alert variant="success">
            Password updated. Sign in with your new password.
          </Alert>
        </div>
      ) : null}

      <GoogleButton />
      <p className="mb-4 mt-2 text-center font-rajdhani text-xs tracking-wide text-slate-500">
        Google is fastest, but email works too.
      </p>

      <div className="my-5 flex items-center gap-3" aria-hidden="true">
        <span className="h-px flex-1 bg-white/10" />
        <span className="font-orbitron text-[9px] uppercase tracking-[0.24em] text-slate-500">
          or
        </span>
        <span className="h-px flex-1 bg-white/10" />
      </div>

      <form onSubmit={submit} className="space-y-4" noValidate>
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
          autoFocus
          required
        />

        <div>
          <PasswordField
            label="Password"
            name="password"
            autoComplete="current-password"
            placeholder="Your password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
          />
          <div className="mt-2 flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
            <Link
              href="/forgot-password"
              className="font-rajdhani text-sm text-slate-400 underline-offset-4 transition-colors hover:text-white hover:underline"
            >
              Forgot password?
            </Link>
            <Link
              href="/forgot-email"
              className="font-rajdhani text-sm text-slate-400 underline-offset-4 transition-colors hover:text-white hover:underline"
            >
              Forgot email?
            </Link>
          </div>
        </div>

        <Button type="submit" fullWidth loading={pending} className="mt-2">
          {pending ? "Signing in" : "Sign in"}
        </Button>
      </form>

      <p className="mt-6 border-t border-white/10 pt-5 text-center font-rajdhani text-sm text-slate-500">
        New here?{" "}
        <Link
          href="/signup"
          className="font-semibold text-white underline-offset-4 transition-colors hover:underline"
        >
          Join DCITC
        </Link>
      </p>
    </AuthCard>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="w-full max-w-[440px]">
          <div className="h-96 animate-pulse border border-white/10 bg-white/[0.02]" />
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
