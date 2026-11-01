"use client";

import { MailCheck } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import AuthCard from "@/components/auth/AuthCard";
import Alert from "@/components/ui/Alert";
import Button from "@/components/ui/Button";
import TextField from "@/components/ui/TextField";
import { apiFetch } from "@/lib/api";

const BATCHES = ["DC-27", "DC-26", "DC-25"];

export default function ForgotEmailPage() {
  const [name, setName] = useState("");
  const [hscBatch, setHscBatch] = useState("");
  const [pending, setPending] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (pending) return;
    const nextErrors: Record<string, string> = {};
    if (!name.trim()) nextErrors.name = "Enter the name on your account.";
    if (!hscBatch.trim()) nextErrors.hscBatch = "Add your HSC batch.";
    setFieldErrors(nextErrors);
    setError("");
    if (Object.keys(nextErrors).length > 0) return;

    setPending(true);
    try {
      await apiFetch("/auth/email/recover", {
        method: "POST",
        body: { name: name.trim(), hscBatch: hscBatch.trim() },
      });
    } catch {
      /* Recovery always returns the same neutral result. */
    } finally {
      setSubmitted(true);
      setPending(false);
    }
  }

  return (
    <AuthCard
      eyebrow="Account recovery"
      title="Forgot your email?"
      subtitle="Tell us your name and HSC batch. If the details match a member, we will email the address on that account."
    >
      {submitted ? (
        <div className="space-y-5">
          <div className="flex items-start gap-3 border border-white/15 bg-white/[0.04] p-4">
            <MailCheck
              className="mt-0.5 h-5 w-5 shrink-0 text-slate-300"
              aria-hidden="true"
            />
            <div>
              <p className="font-orbitron text-xs uppercase tracking-[0.16em] text-white">
                Check your inbox
              </p>
              <p className="mt-1.5 font-rajdhani text-sm leading-snug text-slate-400">
                If a member matches {name.trim() || "those details"}{" "}
                {hscBatch.trim() ? `in ${hscBatch.trim()}` : ""}, the email on
                file will receive a recovery message shortly.
              </p>
            </div>
          </div>

          <p className="font-rajdhani text-sm text-slate-500">
            For privacy, we show the same message whether or not an account
            matches.
          </p>

          <div className="flex flex-col gap-2 border-t border-white/10 pt-4">
            <Button href="/login" fullWidth>
              Back to sign in
            </Button>
            <button
              type="button"
              onClick={() => {
                setSubmitted(false);
                setError("");
              }}
              className="font-rajdhani text-sm text-slate-500 underline-offset-4 transition-colors hover:text-white hover:underline"
            >
              Try different details
            </button>
          </div>
        </div>
      ) : (
        <form onSubmit={submit} className="space-y-4" noValidate>
          {error ? <Alert variant="error">{error}</Alert> : null}

          <TextField
            label="Full name"
            name="name"
            autoComplete="name"
            placeholder="The name on your account"
            value={name}
            onChange={(event) => setName(event.target.value)}
            error={fieldErrors.name}
            autoFocus
            required
          />

          <div>
            <TextField
              label="HSC batch"
              name="hscBatch"
              list="recover-batches"
              autoComplete="off"
              placeholder="e.g. DC-26"
              value={hscBatch}
              onChange={(event) => setHscBatch(event.target.value)}
              error={fieldErrors.hscBatch}
              hint="Type it exactly as you signed up."
              required
            />
            <datalist id="recover-batches">
              {BATCHES.map((batch) => (
                <option key={batch} value={batch} />
              ))}
            </datalist>
          </div>

          <Button type="submit" fullWidth loading={pending}>
            {pending ? "Checking" : "Recover my email"}
          </Button>

          <p className="border-t border-white/10 pt-4 text-center font-rajdhani text-sm text-slate-500">
            Know your email?{" "}
            <Link
              href="/login"
              className="text-white underline-offset-4 hover:underline"
            >
              Back to sign in
            </Link>
          </p>
        </form>
      )}
    </AuthCard>
  );
}
