"use client";
import { useState, useEffect } from "react";
import { apiFetch } from "@/lib/api";
import { uploadImage } from "@/lib/upload";
import type { Achievement } from "@/lib/api-types";

type FormState = {
  title: string;
  detail: string;
  year: string;
  image: string;
  gallery: string[];
};

const empty: FormState = { title: "", detail: "", year: "", image: "", gallery: ["", "", "", ""] };

export default function AdminAchievementsPage() {
  const [items, setItems] = useState<Achievement[]>([]);
  const [form, setForm] = useState<FormState>(empty);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [slotSelection, setSlotSelection] = useState<Record<number, string>>({});

  async function load() {
    try {
      const data = await apiFetch<Achievement[]>("/admin/achievements");
      setItems(data);
    } catch (err) {
      const e = err as { message?: string };
      setError(e?.message || "Failed to load");
    }
  }
  useEffect(() => { load(); }, []);

  async function onUpload(field: "image" | "gallery", index?: number) {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;
      try {
        const url = await uploadImage(file);
        if (field === "image") {
          setForm((f) => ({ ...f, image: url }));
        } else if (index !== undefined) {
          setForm((f) => {
            const g = [...f.gallery];
            g[index] = url;
            return { ...f, gallery: g };
          });
        }
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
      title: form.title,
      detail: form.detail,
      year: Number(form.year),
      image: form.image || null,
      gallery: form.gallery.filter(Boolean),
    };
    try {
      if (editingId !== null) {
        await apiFetch(`/admin/achievements/${editingId}`, { method: "PATCH", body });
      } else {
        await apiFetch("/admin/achievements", { method: "POST", body });
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

  function edit(item: Achievement) {
    setEditingId(item.id);
    setForm({
      title: item.title,
      detail: item.detail,
      year: String(item.year),
      image: item.image ?? "",
      gallery: [...(item.gallery ?? []), "", "", "", ""].slice(0, 4),
    });
  }

  async function remove(id: number) {
    if (!window.confirm("Delete this achievement?")) return;
    try {
      await apiFetch(`/admin/achievements/${id}`, { method: "DELETE" });
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
      await apiFetch(`/admin/achievements/${id}/featured`, { method: "PUT", body: { slot } });
      await load();
    } catch (err) {
      const e2 = err as { message?: string; code?: string };
      if (e2?.code === "slot_taken" || (e2?.message || "").includes("slot_taken")) {
        setError("Slot already taken");
      } else {
        setError(e2?.message || "Failed");
      }
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-orbitron font-bold text-white">Achievements</h1>
      {error && <p className="text-sm text-red-400">{error}</p>}

      <form onSubmit={submit} className="space-y-3 border border-white/10 p-4">
        <input placeholder="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="w-full rounded border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100" required />
        <textarea placeholder="Detail" value={form.detail} onChange={(e) => setForm({ ...form, detail: e.target.value })} className="w-full rounded border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100" required />
        <input placeholder="Year" type="number" value={form.year} onChange={(e) => setForm({ ...form, year: e.target.value })} className="w-full rounded border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100" required />
        <div className="flex gap-2">
          <input placeholder="Image URL" value={form.image} onChange={(e) => setForm({ ...form, image: e.target.value })} className="flex-1 rounded border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100" />
          <button type="button" onClick={() => onUpload("image")} className="px-3 py-2 border border-white/20 text-slate-300">Upload</button>
        </div>
        {form.gallery.map((g, i) => (
          <div key={i} className="flex gap-2">
            <input placeholder={`Gallery ${i + 1}`} value={g} onChange={(e) => {
              const ng = [...form.gallery]; ng[i] = e.target.value; setForm({ ...form, gallery: ng });
            }} className="flex-1 rounded border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100" />
            <button type="button" onClick={() => onUpload("gallery", i)} className="px-3 py-2 border border-white/20 text-slate-300">Upload</button>
          </div>
        ))}
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
              <p className="text-white font-rajdhani">{item.title} ({item.year}) slot={item.featuredSlot ?? "none"}</p>
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
                {[1, 2, 3, 4, 5].map((n) => (
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