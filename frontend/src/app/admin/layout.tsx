"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import AdminShell from "@/components/admin/AdminShell";
import Alert from "@/components/ui/Alert";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
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
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (pathname === "/admin/login") return;
    let cancelled = false;
    (async () => {
      try {
        const me = await apiFetch<Admin>("/admin/auth/me");
        if (!cancelled) setAdmin(me);
      } catch (err) {
        // Only an unauthenticated session is a sign-out; an outage is not.
        const apiError = err as { status?: number };
        if (apiError?.status === 401) {
          if (!cancelled) router.replace("/admin/login");
        } else if (!cancelled) {
          setError("Could not reach the admin service. Check your connection and try again.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [pathname, router, attempt]);

  if (pathname === "/admin/login") return <>{children}</>;

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-bg px-4 text-muted">
        <Card className="w-full max-w-lg">
          <p className="type-overline uppercase tracking-[0.24em] text-faint">
            Admin console
          </p>
          <div className="mt-4">
            <Alert variant="error">{error}</Alert>
          </div>
          <div className="mt-5 flex gap-2">
            <Button
              type="button"
              onClick={() => {
                setError("");
                setLoading(true);
                setAttempt((value) => value + 1);
              }}
            >
              Retry
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-bg" aria-busy="true">
        <div className="fixed inset-y-0 left-0 hidden w-64 border-r border-line p-5 lg:block">
          <span className="block h-10 w-28 animate-pulse bg-surface-2" />
          <div className="mt-12 space-y-2">
            {Array.from({ length: 5 }).map((_, index) => (
              <span
                key={index}
                className="block h-8 animate-pulse bg-surface-2"
              />
            ))}
          </div>
        </div>
        <div className="border-b border-line p-4 lg:hidden">
          <span className="block h-8 w-32 animate-pulse bg-surface-2" />
        </div>
        <div className="space-y-4 p-6 lg:pl-72">
          <span className="block h-3 w-24 animate-pulse bg-surface-2" />
          <span className="block h-8 w-56 animate-pulse bg-surface-2" />
          <div className="grid gap-3 sm:grid-cols-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <span
                key={index}
                className="h-28 animate-pulse bg-surface-2"
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
