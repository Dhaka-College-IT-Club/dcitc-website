"use client";

import { Lock } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import AuthCard from "@/components/auth/AuthCard";
import AuthLayout from "@/components/auth/AuthLayout";
import Alert from "@/components/ui/Alert";
import Button from "@/components/ui/Button";
import PasswordField from "@/components/ui/PasswordField";
import TextField from "@/components/ui/TextField";
import { apiFetch } from "@/lib/api";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (pending) return;
    setPending(true);
    setError("");
    try {
      await apiFetch("/admin/auth/login", {
        method: "POST",
        body: { email, password },
      });
      router.replace("/admin");
    } catch {
      setError("Those credentials were not accepted.");
    } finally {
      setPending(false);
    }
  }

  return (
    <AuthLayout
      panelEyebrow="Restricted access"
      panelNote="Operator tooling for club content, featured slots, and member-facing settings. Actions here are recorded in the audit log."
    >
      <AuthCard
        eyebrow="Staff only"
        title="Admin console"
        subtitle="Authorised operators sign in here. Member accounts use the public login."
      >
        <div className="mb-5 flex items-start gap-2.5 border border-white/10 bg-white/[0.02] px-3 py-2.5">
          <Lock className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-500" aria-hidden="true" />
          <p className="font-rajdhani text-xs leading-snug text-slate-500">
            This area is not linked publicly. Every write action is attributed
            to your operator account.
          </p>
        </div>

        <form onSubmit={submit} className="space-y-4" noValidate>
          {error ? <Alert variant="error">{error}</Alert> : null}

          <TextField
            label="Email"
            name="email"
            type="email"
            autoComplete="username"
            placeholder="you@example.com"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            autoFocus
            required
          />

          <PasswordField
            label="Password"
            name="password"
            autoComplete="current-password"
            placeholder="Operator password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
          />

          <Button type="submit" fullWidth loading={pending} className="mt-2">
            {pending ? "Verifying" : "Enter console"}
          </Button>
        </form>

        <p className="mt-6 border-t border-white/10 pt-5 text-center font-rajdhani text-sm text-slate-500">
          <Link
            href="/"
            className="underline-offset-4 transition-colors hover:text-slate-300 hover:underline"
          >
            Return to public site
          </Link>
        </p>
      </AuthCard>
    </AuthLayout>
  );
}
