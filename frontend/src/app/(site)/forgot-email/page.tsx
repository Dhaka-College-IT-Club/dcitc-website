"use client";
import { useState } from "react";
import AuthShell from "@/components/auth/AuthShell";
import Field from "@/components/auth/Field";
import SubmitButton from "@/components/auth/SubmitButton";
import { apiFetch } from "@/lib/api";

export default function ForgotEmailPage() {
  const [name, setName] = useState("");
  const [hscBatch, setHscBatch] = useState("");
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    try {
      await apiFetch("/auth/email/recover", { method: "POST", body: { name, hscBatch } });
    } catch {
      /* ignore */
    } finally {
      setMessage("If a match exists, a recovery email was sent.");
      setPending(false);
    }
  }

  return (
    <AuthShell title="Recover email">
      <form onSubmit={submit} className="space-y-4">
        <Field label="Name" name="name" value={name} onChange={(e) => setName(e.target.value)} required />
        <Field label="HSC Batch" name="hscBatch" value={hscBatch} onChange={(e) => setHscBatch(e.target.value)} required />
        {message && <p className="text-sm text-slate-400">{message}</p>}
        <SubmitButton pending={pending}>Recover</SubmitButton>
      </form>
    </AuthShell>
  );
}