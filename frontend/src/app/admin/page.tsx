"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api";
import type { Admin } from "@/lib/api-types";

export default function AdminHome() {
  const router = useRouter();
  const [admin, setAdmin] = useState<Admin | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const me = await apiFetch<Admin>("/admin/auth/me");
        setAdmin(me);
      } catch {
        router.replace("/admin/login");
      }
    })();
  }, [router]);

  if (!admin) return null;

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-orbitron font-bold text-white">Admin</h1>
      <p className="font-rajdhani text-slate-300">Signed in as {admin.username} ({admin.role})</p>
    </div>
  );
}