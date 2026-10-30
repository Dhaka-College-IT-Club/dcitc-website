"use client";

import { ArrowUpRight, CalendarDays, ShieldCheck } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import DashboardShell from "@/components/dashboard/DashboardShell";
import Button from "@/components/ui/Button";
import { apiFetch } from "@/lib/api";
import type { PublicSettings, User } from "@/lib/api-types";

function memberSince(value: string | undefined) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString("en-GB", { month: "long", year: "numeric" });
}

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [settings, setSettings] = useState<PublicSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [signingOut, setSigningOut] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [profile, publicSettings] = await Promise.all([
          apiFetch<User>("/auth/me"),
          apiFetch<PublicSettings>("/settings/public").catch(() => null),
        ]);
        if (cancelled) return;
        setUser(profile);
        setSettings(publicSettings);
      } catch (err) {
        const apiError = err as { status?: number };
        if (apiError?.status === 401) {
          try {
            await apiFetch("/auth/logout", { method: "POST" });
          } catch {
            /* ignore */
          }
          if (!cancelled) router.replace("/login?next=/dashboard");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [router]);

  async function signOut() {
    if (signingOut) return;
    setSigningOut(true);
    try {
      await apiFetch("/auth/logout", { method: "POST" });
    } catch {
      /* ignore */
    }
    router.replace("/");
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-slate-200">
        <div className="border-b border-white/10 px-4 py-3 sm:px-6">
          <div className="mx-auto flex max-w-5xl items-center justify-between">
            <span className="h-10 w-24 animate-pulse bg-white/10" />
            <span className="h-9 w-24 animate-pulse bg-white/[0.07]" />
          </div>
        </div>
        <div className="mx-auto max-w-5xl space-y-6 px-4 py-10 sm:px-6">
          <span className="block h-3 w-28 animate-pulse bg-white/10" />
          <span className="block h-9 w-2/3 max-w-md animate-pulse bg-white/10" />
          <div className="grid gap-4 lg:grid-cols-5">
            <span className="h-64 animate-pulse bg-white/[0.05] lg:col-span-3" />
            <span className="h-64 animate-pulse bg-white/[0.04] lg:col-span-2" />
          </div>
        </div>
      </div>
    );
  }

  if (!user) return null;

  const since = memberSince(user.createdAt);
  const price = settings?.membershipPriceBdt ?? 100;
  const formUrl = settings?.membershipFormUrl ?? null;

  return (
    <DashboardShell user={user} onLogout={signOut} signingOut={signingOut}>
      <header className="mb-7">
        <p className="font-orbitron text-[10px] uppercase tracking-[0.28em] text-slate-500">
          Member / dashboard
        </p>
        <h1 className="mt-2 font-orbitron text-2xl font-bold leading-tight tracking-tight text-white sm:text-3xl md:text-4xl">
          Welcome,{" "}
          <span className="break-words text-transparent bg-clip-text bg-linear-to-r from-white via-slate-300 to-slate-500">
            {user.name}
          </span>
        </h1>
        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 font-rajdhani text-sm text-slate-400">
          <span className="inline-flex items-center gap-1.5 border border-white/15 px-2 py-0.5 font-orbitron text-[9px] uppercase tracking-[0.16em] text-slate-300">
            <ShieldCheck className="h-3 w-3" aria-hidden="true" />
            {user.hscBatch}
          </span>
          {since ? (
            <span className="inline-flex items-center gap-1.5">
              <CalendarDays className="h-3.5 w-3.5 text-slate-500" aria-hidden="true" />
              Member since {since}
            </span>
          ) : null}
        </div>
      </header>

      <div className="grid items-start gap-4 lg:grid-cols-5">
        <section
          aria-labelledby="membership-title"
          className="clip-notch relative overflow-hidden border border-white/30 bg-white/[0.05] p-5 sm:p-7 lg:col-span-3"
        >
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full bg-white/[0.07] blur-[70px]"
          />
          <div
            aria-hidden="true"
            className="tech-grid pointer-events-none absolute inset-0 opacity-20"
          />
          <div className="relative">
            <div className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 bg-white" aria-hidden="true" />
              <p className="font-orbitron text-[10px] uppercase tracking-[0.26em] text-slate-400">
                Membership
              </p>
            </div>
            <h2
              id="membership-title"
              className="mt-3 font-orbitron text-xl font-bold tracking-tight text-white sm:text-2xl"
            >
              Be a Member
            </h2>
            <p className="mt-4 font-orbitron text-4xl font-bold leading-none text-white sm:text-5xl">
              {price}
              <span className="ml-2 font-orbitron text-base font-medium tracking-[0.16em] text-slate-400">
                BDT
              </span>
            </p>
            <p className="mt-3 max-w-sm font-rajdhani text-base leading-snug tracking-wide text-slate-300">
              Only {price} BDT for the full year — workshops, events, and the
              member network.
            </p>

            <div className="mt-6">
              {formUrl ? (
                <Button
                  href={formUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  size="lg"
                >
                  Become a Member
                  <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
                </Button>
              ) : (
                <>
                  <Button type="button" size="lg" disabled>
                    Membership closed
                  </Button>
                  <p className="mt-3 max-w-sm font-rajdhani text-sm text-slate-400">
                    Membership is not open yet. The club will publish the form
                    here as soon as enrolment starts.
                  </p>
                </>
              )}
            </div>

            {formUrl ? (
              <p className="mt-3 font-rajdhani text-xs text-slate-500">
                Opens the official membership form in a new tab.
              </p>
            ) : null}
          </div>
        </section>

        <section
          aria-labelledby="account-title"
          className="border border-white/10 bg-white/[0.02] p-5 sm:p-6 lg:col-span-2"
        >
          <p className="font-orbitron text-[10px] uppercase tracking-[0.26em] text-slate-500">
            Account
          </p>
          <h2
            id="account-title"
            className="mt-2 font-orbitron text-base font-bold text-white"
          >
            Your details
          </h2>
          <dl className="mt-5 divide-y divide-white/5 border-t border-white/5">
            <div className="py-3">
              <dt className="font-orbitron text-[9px] uppercase tracking-[0.16em] text-slate-500">
                Name
              </dt>
              <dd className="mt-1 break-words font-rajdhani text-base text-slate-200">
                {user.name}
              </dd>
            </div>
            <div className="py-3">
              <dt className="font-orbitron text-[9px] uppercase tracking-[0.16em] text-slate-500">
                Email
              </dt>
              <dd className="mt-1 break-all font-rajdhani text-base text-slate-200">
                {user.email}
              </dd>
            </div>
            <div className="py-3">
              <dt className="font-orbitron text-[9px] uppercase tracking-[0.16em] text-slate-500">
                HSC batch
              </dt>
              <dd className="mt-1 font-rajdhani text-base text-slate-200">
                {user.hscBatch}
              </dd>
            </div>
          </dl>
          <p className="mt-4 border-t border-white/5 pt-4 font-rajdhani text-xs leading-snug text-slate-500">
            Need a detail changed? Contact a club executive from the public
            site.
          </p>
        </section>
      </div>
    </DashboardShell>
  );
}
