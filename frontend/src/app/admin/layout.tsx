"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import AdminShell from "@/components/admin/AdminShell";
import { apiFetch } from "@/lib/api";
import type { Admin } from "@/lib/api-types";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [admin, setAdmin] = useState<Admin | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (pathname === "/admin/login") {
      setLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const me = await apiFetch<Admin>("/admin/auth/me");
        if (!cancelled) setAdmin(me);
      } catch {
        if (!cancelled) router.replace("/admin/login");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [pathname, router]);

  if (pathname === "/admin/login") return <>{children}</>;

  if (loading) {
    return (
      <div className="min-h-screen bg-black" aria-busy="true">
        <div className="fixed inset-y-0 left-0 hidden w-64 border-r border-white/10 p-5 lg:block">
          <span className="block h-10 w-28 animate-pulse bg-white/10" />
          <div className="mt-12 space-y-2">
            {Array.from({ length: 5 }).map((_, index) => (
              <span
                key={index}
                className="block h-8 animate-pulse bg-white/[0.05]"
              />
            ))}
          </div>
        </div>
        <div className="border-b border-white/10 p-4 lg:hidden">
          <span className="block h-8 w-32 animate-pulse bg-white/10" />
        </div>
        <div className="space-y-4 p-6 lg:pl-72">
          <span className="block h-3 w-24 animate-pulse bg-white/10" />
          <span className="block h-8 w-56 animate-pulse bg-white/10" />
          <div className="grid gap-3 sm:grid-cols-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <span
                key={index}
                className="h-28 animate-pulse bg-white/[0.05]"
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!admin) return null;

  async function logout() {
    try {
      await apiFetch("/admin/auth/logout", { method: "POST" });
    } catch {
      /* ignore */
    }
    router.replace("/admin/login");
  }

  return (
    <AdminShell admin={admin} onLogout={logout}>
      {children}
    </AdminShell>
  );
}
