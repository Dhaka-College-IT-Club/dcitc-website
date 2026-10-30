"use client";
import { useState, useEffect } from "react";
import { apiFetch } from "@/lib/api";
import type { PublicSettings } from "@/lib/api-types";

export default function AdminSettingsPage() {
  const [formUrl, setFormUrl] = useState("");
  const [price, setPrice] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const s = await apiFetch<PublicSettings>("/settings/public");
        setFormUrl(s.membershipFormUrl ?? "");
        setPrice(String(s.membershipPriceBdt));
      } catch {
        /* ignore */
      }
    })();
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    setError("");
    setSuccess(false);
    try {
      await apiFetch("/admin/settings", {
        method: "PUT",
        body: { membershipFormUrl: formUrl, membershipPriceBdt: Number(price) },
      });
      setSuccess(true);
    } catch (err) {
      const e2 = err as { message?: string };
      setError(e2?.message || "Save failed");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="max-w-xl space-y-4">
      <h1 className="text-2xl font-orbitron font-bold text-white">Settings</h1>
      <form onSubmit={submit} className="space-y-4">
        <div>
          <label className="block text-sm text-slate-300 mb-1">Membership form URL</label>
          <input
            value={formUrl}
            onChange={(e) => setFormUrl(e.target.value)}
            className="w-full rounded border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100"
          />
        </div>
        <div>
          <label className="block text-sm text-slate-300 mb-1">Membership price (BDT)</label>
          <input
            type="number"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            className="w-full rounded border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100"
          />
        </div>
        {error && <p className="text-sm text-red-400">{error}</p>}
        {success && <p className="text-sm text-green-400">Saved</p>}
        <button
          type="submit"
          disabled={pending}
          className="px-6 py-2 bg-white text-black font-orbitron font-bold tracking-wider disabled:opacity-50"
        >
          {pending ? "Saving…" : "Save"}
        </button>
      </form>
    </div>
  );
}