"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import AuthShell from "@/components/auth/AuthShell";
import Field from "@/components/auth/Field";
import SubmitButton from "@/components/auth/SubmitButton";
import { apiFetch } from "@/lib/api";

export default function AdminLoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    setError("");
    try {
      await apiFetch("/admin/auth/login", { method: "POST", body: { username, password } });
      router.replace("/admin");
    } catch {
      setError("Invalid credentials");
    } finally {
      setPending(false);
    }
  }

  return (
    <AuthShell title="Admin login">
      <form onSubmit={submit} className="space-y-4">
        <Field label="Username" name="username" value={username} onChange={(e) => setUsername(e.target.value)} required />
        <Field label="Password" type="password" name="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        {error && <p className="text-sm text-red-400">{error}</p>}
        <SubmitButton pending={pending}>Login</SubmitButton>
      </form>
    </AuthShell>
  );
}