"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api";

type AuditEntry = { id: number; action: string; actorId: number | null; targetType: string | null; targetId: number | null; createdAt: string };

export default function AdminAuditLogPage() {
  const router = useRouter();
  const [items, setItems] = useState<AuditEntry[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const me = await apiFetch<{ role: string }>("/admin/auth/me");
        if (me.role !== "super_admin") {
          router.replace("/admin");
          return;
        }
        const data = await apiFetch<AuditEntry[]>("/super-admin/audit-log?limit=100");
        setItems(data);
      } catch (err) {
        const e = err as { message?: string };
        setError(e?.message || "Failed to load");
      }
    })();
  }, [router]);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-orbitron font-bold text-white">Audit Log</h1>
      {error && <p className="text-sm text-red-400">{error}</p>}
      <div className="space-y-2">
        {items.map((e) => (
          <div key={e.id} className="border border-white/10 p-3 font-rajdhani text-sm text-slate-300">
            <span className="text-white">{e.action}</span> — {e.createdAt} {e.targetType ? `(${e.targetType} ${e.targetId})` : ""}
          </div>
        ))}
      </div>
    </div>
  );
}