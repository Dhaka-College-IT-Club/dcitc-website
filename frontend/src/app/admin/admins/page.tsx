"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api";

type Admin = { id: number; username: string; role: string; active: boolean; createdAt: string };

export default function AdminAdminsPage() {
  const router = useRouter();
  const [items, setItems] = useState<Admin[]>([]);
  const [error, setError] = useState("");
  const [form, setForm] = useState({ username: "", password: "", role: "admin" });
  const [pending, setPending] = useState(false);
  const [currentId, setCurrentId] = useState<number | null>(null);

  async function load() {
    try {
      const me = await apiFetch<{ id: number; role: string }>("/admin/auth/me");
      setCurrentId(me.id);
      if (me.role !== "super_admin") {
        router.replace("/admin");
        return;
      }
      const data = await apiFetch<Admin[]>("/super-admin/admins");
      setItems(data);
    } catch (err) {
      const e = err as { message?: string };
      setError(e?.message || "Failed to load");
    }
  }
  useEffect(() => { load(); }, []);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    setError("");
    try {
      await apiFetch("/super-admin/admins", { method: "POST", body: form });
      setForm({ username: "", password: "", role: "admin" });
      await load();
    } catch (err) {
      const e2 = err as { message?: string };
      setError(e2?.message || "Create failed");
    } finally {
      setPending(false);
    }
  }

  async function toggleActive(item: Admin) {
    try {
      await apiFetch(`/super-admin/admins/${item.id}`, { method: "PATCH", body: { active: !item.active } });
      await load();
    } catch (err) {
      const e2 = err as { message?: string };
      setError(e2?.message || "Update failed");
    }
  }

  async function rotatePassword(item: Admin) {
    const pw = window.prompt("New password:");
    if (!pw) return;
    try {
      await apiFetch(`/super-admin/admins/${item.id}/rotate-password`, { method: "POST", body: { password: pw } });
      await load();
    } catch (err) {
      const e2 = err as { message?: string };
      setError(e2?.message || "Rotate failed");
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-orbitron font-bold text-white">Admins</h1>
      {error && <p className="text-sm text-red-400">{error}</p>}

      <form onSubmit={create} className="flex flex-wrap gap-2 border border-white/10 p-4">
        <input placeholder="Username" value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} className="rounded border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100" required />
        <input placeholder="Password" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className="rounded border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100" required />
        <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} className="rounded border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100">
          <option value="admin">admin</option>
          <option value="super_admin">super_admin</option>
        </select>
        <button type="submit" disabled={pending} className="px-6 py-2 bg-white text-black font-orbitron font-bold tracking-wider disabled:opacity-50">
          {pending ? "Creating…" : "Create"}
        </button>
      </form>

      <div className="space-y-2">
        {items.map((item) => (
          <div key={item.id} className="border border-white/10 p-3 flex items-center justify-between gap-3">
            <p className="text-white font-rajdhani">{item.username} ({item.role}) {item.active ? "" : "[inactive]"}</p>
            <div className="flex gap-2">
              <button
                onClick={() => toggleActive(item)}
                className="px-3 py-1 text-sm border border-white/20 text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed"
                disabled={item.id === currentId}
                title={item.id === currentId ? "You cannot deactivate your own account" : undefined}
              >
                {item.active ? "Deactivate" : "Activate"}
              </button>
              <button onClick={() => rotatePassword(item)} className="px-3 py-1 text-sm border border-white/20 text-slate-300">Rotate password</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}