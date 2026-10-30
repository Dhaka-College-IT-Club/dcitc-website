"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api";
import type { User, PublicSettings } from "@/lib/api-types";

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [settings, setSettings] = useState<PublicSettings | null>(null);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      const [u, s] = await Promise.all([
        apiFetch<User>("/auth/me"),
        apiFetch<PublicSettings>("/settings/public"),
      ]);
      setUser(u);
      setSettings(s);
    } catch (err) {
      const e = err as { status?: number };
      if (e?.status === 401) {
        try {
          await apiFetch("/auth/logout", { method: "POST" });
        } catch {
          /* ignore */
        }
        router.replace("/login?next=/dashboard");
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function signOut() {
    try {
      await apiFetch("/auth/logout", { method: "POST" });
    } catch {
      /* ignore */
    }
    router.replace("/");
  }

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-black text-slate-400">
        Loading…
      </main>
    );
  }

  if (!user) return null;

  return (
    <main className="min-h-screen bg-black text-slate-200 pt-24 sm:pt-32 pb-16">
      <div className="max-w-3xl mx-auto px-6 space-y-6">
        <h1 className="text-3xl font-orbitron font-bold text-white">Dashboard</h1>
        <div className="border border-white/10 bg-white/[0.02] p-6 space-y-2">
          <p className="font-rajdhani text-lg">Name: {user.name}</p>
          <p className="font-rajdhani text-lg">Email: {user.email}</p>
          <p className="font-rajdhani text-lg">Batch: {user.hscBatch}</p>
        </div>

        <div className="border border-white/10 bg-white/[0.02] p-6 space-y-3">
          <h2 className="font-orbitron text-white">Be a Member — only {settings?.membershipPriceBdt ?? 100} BDT</h2>
          {settings?.membershipFormUrl ? (
            <a
              href={settings.membershipFormUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block px-6 py-2 bg-white text-black font-orbitron font-bold tracking-wider"
            >
              Open form
            </a>
          ) : (
            <button disabled className="px-6 py-2 bg-slate-700 text-slate-400 font-orbitron font-bold tracking-wider cursor-not-allowed">
              Form unavailable
            </button>
          )}
        </div>

        <button
          onClick={signOut}
          className="px-6 py-2 border border-white/20 text-slate-300 hover:text-white font-orbitron text-sm tracking-wider"
        >
          Sign out
        </button>
      </div>
    </main>
  );
}