"use client";
import { useState, useEffect } from "react";
import { apiFetch } from "@/lib/api";
import { uploadImage } from "@/lib/upload";
import type { Intel } from "@/lib/api-types";

type FormState = {
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  tag: string;
  date: string;
  image: string;
};

const empty: FormState = { slug: "", title: "", excerpt: "", content: "", tag: "", date: "", image: "" };

export default function AdminIntelsPage() {
  const [items, setItems] = useState<Intel[]>([]);
  const [form, setForm] = useState<FormState>(empty);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [slotSelection, setSlotSelection] = useState<Record<number, string>>({});

  async function load() {
    try {
      const data = await apiFetch<Intel[]>("/admin/intels");
      setItems(data);
    } catch (err) {
      const e = err as { message?: string };
      setError(e?.message || "Failed to load");
    }
  }
  useEffect(() => { load(); }, []);

  async function onUpload() {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;
      try {
        const url = await uploadImage(file);
        setForm((f) => ({ ...f, image: url }));
      } catch (err) {
        const e2 = err as { message?: string };
        setError(e2?.message || "Upload failed");
      }
    };
    input.click();
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    setError("");
    const body = {
      slug: form.slug,
      title: form.title,
      excerpt: form.excerpt,
      content: form.content,
      tag: form.tag,
      date: form.date,
      image: form.image || null,
    };
    try {
      if (editingId !== null) {
        await apiFetch(`/admin/intels/${editingId}`, { method: "PATCH", body });
      } else {
        await apiFetch("/admin/intels", { method: "POST", body });
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

  function edit(item: Intel) {
    setEditingId(item.id);
    setForm({
      slug: item.slug,
      title: item.title,
      excerpt: item.excerpt,
      content: item.content,
      tag: item.tag,
      date: item.date,
      image: item.image ?? "",
    });
  }

  async function remove(id: number) {
    if (!window.confirm("Delete this intel?")) return;
    try {
      await apiFetch(`/admin/intels/${id}`, { method: "DELETE" });
      await load();
    } catch (err) {
      const e2 = err as { message?: string };
      setError(e2?.message || "Delete failed");
    }
  }

  async function setFeatured(id: number) {
    const val = slotSelection[id] ?? "";
    const slot = val === "" ? null : Number(val) - 1;
    try {
      await apiFetch(`/admin/intels/${id}/featured`, { method: "PUT", body: { slot } });
      await load();
    } catch (err) {
      const e2 = err as { message?: string };
      setError(e2?.message || "Failed");
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-orbitron font-bold text-white">Intels</h1>
      {error && <p className="text-sm text-red-400">{error}</p>}

      <form onSubmit={submit} className="space-y-3 border border-white/10 p-4">
        <input placeholder="Slug" value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} className="w-full rounded border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100" required />
        <input placeholder="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="w-full rounded border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100" required />
        <input placeholder="Excerpt" value={form.excerpt} onChange={(e) => setForm({ ...form, excerpt: e.target.value })} className="w-full rounded border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100" required />
        <textarea placeholder="Content" value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} className="w-full rounded border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100" required />
        <input placeholder="Tag" value={form.tag} onChange={(e) => setForm({ ...form, tag: e.target.value })} className="w-full rounded border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100" required />
        <input placeholder="Date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} className="w-full rounded border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100" required />
        <div className="flex gap-2">
          <input placeholder="Image URL" value={form.image} onChange={(e) => setForm({ ...form, image: e.target.value })} className="flex-1 rounded border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100" />
          <button type="button" onClick={onUpload} className="px-3 py-2 border border-white/20 text-slate-300">Upload</button>
        </div>
        <div className="flex gap-2">
          <button type="submit" disabled={pending} className="px-6 py-2 bg-white text-black font-orbitron font-bold tracking-wider disabled:opacity-50">
            {pending ? "Saving…" : editingId !== null ? "Update" : "Create"}
          </button>
          {editingId !== null && (
            <button type="button" onClick={() => { setEditingId(null); setForm(empty); }} className="px-6 py-2 border border-white/20 text-slate-300">Cancel</button>
          )}
        </div>
      </form>

      <div className="space-y-3">
        {items.map((item) => (
          <div key={item.id} className="border border-white/10 p-3 space-y-2">
            <div className="flex items-center justify-between gap-3">
              <p className="text-white font-rajdhani">{item.title} (slot={item.featuredSlot ?? "none"})</p>
              <div className="flex gap-2">
                <button onClick={() => edit(item)} className="px-3 py-1 text-sm border border-white/20 text-slate-300">Edit</button>
                <button onClick={() => remove(item.id)} className="px-3 py-1 text-sm border border-red-500/40 text-red-400">Delete</button>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <select
                value={slotSelection[item.id] ?? (item.featuredSlot === null ? "" : String(item.featuredSlot + 1))}
                onChange={(e) => setSlotSelection({ ...slotSelection, [item.id]: e.target.value })}
                className="rounded border border-slate-700 bg-slate-900 px-2 py-1 text-slate-100"
              >
                <option value="">None</option>
                {[1, 2, 3].map((n) => (
                  <option key={n} value={String(n)}>Slot {n}</option>
                ))}
              </select>
              <button onClick={() => setFeatured(item.id)} className="px-3 py-1 text-sm border border-white/20 text-slate-300">Set featured</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}