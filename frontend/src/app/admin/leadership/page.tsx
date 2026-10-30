"use client";
import { useState, useEffect } from "react";
import { apiFetch } from "@/lib/api";
import { uploadImage } from "@/lib/upload";
import type { Leader } from "@/lib/api-types";

type FormState = {
  name: string;
  role: string;
  tier: "executive" | "chief" | "joint";
  batch: string;
  image: string;
  facebook: string;
  linkedin: string;
  github: string;
  portfolio: string;
};

const empty: FormState = { name: "", role: "", tier: "chief", batch: "", image: "", facebook: "", linkedin: "", github: "", portfolio: "" };

export default function AdminLeadershipPage() {
  const [items, setItems] = useState<Leader[]>([]);
  const [form, setForm] = useState<FormState>(empty);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  async function load() {
    try {
      const data = await apiFetch<Leader[]>("/admin/leadership");
      setItems(data);
    } catch (err) {
      const e = err as { message?: string };
      setError(e?.message || "Failed to load");
    }
  }
  useEffect(() => { load(); }, []);

  function update<K extends keyof FormState>(k: K, v: FormState[K]) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function onUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const url = await uploadImage(file);
      update("image", url);
    } catch (err) {
      const e2 = err as { message?: string };
      setError(e2?.message || "Upload failed");
    }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    setError("");
    const body = {
      name: form.name,
      role: form.role,
      tier: form.tier,
      batch: form.batch,
      image: form.image || null,
      facebook: form.facebook || null,
      linkedin: form.linkedin || null,
      github: form.github || null,
      portfolio: form.portfolio || null,
    };
    try {
      if (editingId !== null) {
        await apiFetch(`/admin/leadership/${editingId}`, { method: "PATCH", body });
      } else {
        await apiFetch("/admin/leadership", { method: "POST", body });
      }
      setForm(empty);
      setEditingId(null);
      await load();
    } catch (err) {
      const e2 = err as { message?: string };
      setError(e2?.message || "Save failed");
    } finally {
      setPending(false);
    }
  }

  function edit(item: Leader) {
    setEditingId(item.id);
    setForm({
      name: item.name,
      role: item.role,
      tier: item.tier,
      batch: item.batch,
      image: item.image ?? "",
      facebook: item.facebook ?? "",
      linkedin: item.linkedin ?? "",
      github: item.github ?? "",
      portfolio: item.portfolio ?? "",
    });
  }

  async function remove(id: number) {
    if (!window.confirm("Delete this member?")) return;
    try {
      await apiFetch(`/admin/leadership/${id}`, { method: "DELETE" });
      await load();
    } catch (err) {
      const e2 = err as { message?: string };
      setError(e2?.message || "Delete failed");
    }
  }

  const batches = Array.from(new Set(items.map((i) => i.batch))).sort().reverse();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-orbitron font-bold text-white">Leadership</h1>
      {error && <p className="text-sm text-red-400">{error}</p>}

      <form onSubmit={submit} className="grid grid-cols-1 md:grid-cols-2 gap-3 border border-white/10 p-4">
        <input placeholder="Name" value={form.name} onChange={(e) => update("name", e.target.value)} className="rounded border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100" required />
        <input placeholder="Role" value={form.role} onChange={(e) => update("role", e.target.value)} className="rounded border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100" required />
        <select value={form.tier} onChange={(e) => update("tier", e.target.value as FormState["tier"])} className="rounded border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100">
          <option value="executive">executive</option>
          <option value="chief">chief</option>
          <option value="joint">joint</option>
        </select>
        <input placeholder="Batch" value={form.batch} onChange={(e) => update("batch", e.target.value)} className="rounded border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100" required />
        <input placeholder="Image URL" value={form.image} onChange={(e) => update("image", e.target.value)} className="rounded border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100 md:col-span-2" />
        <input type="file" accept="image/*" onChange={onUpload} className="text-slate-300 md:col-span-2" />
        <input placeholder="Facebook" value={form.facebook} onChange={(e) => update("facebook", e.target.value)} className="rounded border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100" />
        <input placeholder="LinkedIn" value={form.linkedin} onChange={(e) => update("linkedin", e.target.value)} className="rounded border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100" />
        <input placeholder="GitHub" value={form.github} onChange={(e) => update("github", e.target.value)} className="rounded border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100" />
        <input placeholder="Portfolio" value={form.portfolio} onChange={(e) => update("portfolio", e.target.value)} className="rounded border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100" />
        <div className="md:col-span-2 flex gap-2">
          <button type="submit" disabled={pending} className="px-6 py-2 bg-white text-black font-orbitron font-bold tracking-wider disabled:opacity-50">
            {pending ? "Saving…" : editingId !== null ? "Update" : "Create"}
          </button>
          {editingId !== null && (
            <button type="button" onClick={() => { setEditingId(null); setForm(empty); }} className="px-6 py-2 border border-white/20 text-slate-300">
              Cancel
            </button>
          )}
        </div>
      </form>

      {batches.map((b) => (
        <div key={b} className="space-y-2">
          <h2 className="font-orbitron text-white text-lg">{b}</h2>
          <div className="grid gap-3">
            {items.filter((i) => i.batch === b).map((i) => (
              <div key={i.id} className="border border-white/10 p-3 flex items-center justify-between gap-3">
                <div>
                  <p className="text-white font-rajdhani">{i.name} — {i.role} ({i.tier})</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => edit(i)} className="px-3 py-1 text-sm border border-white/20 text-slate-300">Edit</button>
                  <button onClick={() => remove(i.id)} className="px-3 py-1 text-sm border border-red-500/40 text-red-400">Delete</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}