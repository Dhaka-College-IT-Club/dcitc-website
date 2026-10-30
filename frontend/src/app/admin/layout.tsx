"use client";
import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { apiFetch } from "@/lib/api";
import type { Admin } from "@/lib/api-types";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [admin, setAdmin] = useState<Admin | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (pathname === "/admin/login") {
      setLoading(false);
      return;
    }
    (async () => {
      try {
        const me = await apiFetch<Admin>("/admin/auth/me");
        setAdmin(me);
      } catch {
        router.replace("/admin/login");
      } finally {
        setLoading(false);
      }
    })();
  }, [pathname, router]);

  if (pathname === "/admin/login") return <>{children}</>;
  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-black text-slate-400">
        Loading…
      </main>
    );
  }
  if (!admin) return null;

  const isSuper = admin.role === "super_admin";

  async function logout() {
    try {
      await apiFetch("/admin/auth/logout", { method: "POST" });
    } catch {
      /* ignore */
    }
    router.replace("/admin/login");
  }

  const links = [
    { href: "/admin", label: "Dashboard" },
    { href: "/admin/settings", label: "Settings" },
    { href: "/admin/leadership", label: "Leadership" },
    { href: "/admin/achievements", label: "Achievements" },
    { href: "/admin/intels", label: "Intels" },
  ];
  if (isSuper) {
    links.push({ href: "/admin/admins", label: "Admins" });
    links.push({ href: "/admin/audit-log", label: "Audit Log" });
  }

  return (
    <div className="min-h-screen bg-black text-slate-200 flex">
      <aside className="w-56 border-r border-white/10 p-4 space-y-2 hidden md:block">
        <p className="font-orbitron text-xs text-slate-500 uppercase mb-4">
          {admin.username} ({admin.role})
        </p>
        {links.map((l) => (
          <a
            key={l.href}
            href={l.href}
            className={`block px-3 py-2 rounded text-sm font-rajdhani ${
              pathname === l.href ? "bg-white/10 text-white" : "text-slate-400 hover:text-white"
            }`}
          >
            {l.label}
          </a>
        ))}
        <button
          onClick={logout}
          className="block w-full text-left px-3 py-2 text-sm text-slate-400 hover:text-white"
        >
          Logout
        </button>
      </aside>
      <main className="flex-1 p-6">{children}</main>
    </div>
  );
}