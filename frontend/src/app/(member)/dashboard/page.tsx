"use client";

import { ArrowUpRight, CalendarDays, GraduationCap } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import DashboardShell from "@/components/dashboard/DashboardShell";
import Alert from "@/components/ui/Alert";
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
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);
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
        } else if (!cancelled) {
          setError(
            "We couldn't load your dashboard. Check your connection and try again."
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [router, attempt]);

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
          <span className="block h-20 animate-pulse bg-white/[0.05]" />
          <span className="block h-64 animate-pulse bg-white/[0.04]" />
        </div>
      </div>
    );
  }

  if (error && !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black px-4 text-slate-200">
        <div className="w-full max-w-lg border border-white/10 bg-white/[0.02] p-6">
          <p className="font-orbitron text-[10px] uppercase tracking-[0.28em] text-slate-500">
            Member portal
          </p>
          <div className="mt-4">
            <Alert variant="error">{error}</Alert>
          </div>
          <div className="mt-5">
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
        </div>
      </div>
    );
  }

  if (!user) return null;

  const since = memberSince(user.createdAt);
  const price =
    settings && typeof settings.membershipPriceBdt === "number" && settings.membershipPriceBdt > 0
      ? settings.membershipPriceBdt
      : 100;
  const formUrl = settings?.membershipFormUrl ?? null;

  return (
    <DashboardShell user={user} onLogout={signOut} signingOut={signingOut}>
      <header className="mb-7">
        <p className="font-orbitron text-[10px] uppercase tracking-[0.28em] text-slate-500">
          Member portal
        </p>
        <h1 className="mt-2 font-orbitron text-3xl font-bold leading-tight tracking-tight text-white sm:text-4xl md:text-5xl">
          Welcome, <span className="break-words text-white">{user.name}</span>
        </h1>
        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 font-rajdhani text-sm text-slate-400">
          {user.hscBatch ? (
            <span className="inline-flex items-center gap-1.5 border border-white/15 px-2 py-0.5 font-orbitron text-[9px] uppercase tracking-[0.16em] text-slate-300">
              <GraduationCap className="h-3 w-3" aria-hidden="true" />
              {user.hscBatch}
            </span>
          ) : null}
          {since ? (
            <span className="inline-flex items-center gap-1.5">
              <CalendarDays className="h-3.5 w-3.5 text-slate-500" aria-hidden="true" />
              Account created {since}
            </span>
          ) : null}
        </div>
      </header>

      <section
        aria-label="Account"
        className="mb-4 border border-white/10 bg-white/[0.02] px-5 py-4"
      >
        <p className="font-orbitron text-[9px] uppercase tracking-[0.2em] text-slate-500">
          Account
        </p>
        <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-baseline sm:justify-between sm:gap-6">
          <p className="min-w-0 break-all font-rajdhani text-base text-slate-200">
            {user.email}
          </p>
          <p className="font-rajdhani text-sm text-slate-500">
            Need a detail changed?{" "}
            <Link
              href="/#contact"
              className="text-white underline-offset-4 transition-colors hover:underline"
            >
              Contact a club executive
            </Link>
            .
          </p>
        </div>
      </section>

      <section
        aria-labelledby="membership-title"
        className="clip-notch relative overflow-hidden border border-white/30 bg-white/[0.05] p-5 sm:p-7"
      >
        <h2
          id="membership-title"
          className="font-orbitron text-xl font-bold tracking-tight text-white sm:text-2xl"
        >
          Membership
        </h2>
        <p className="mt-4 font-orbitron text-3xl font-bold leading-none text-white sm:text-4xl">
          {price}
          <span className="ml-2 font-orbitron text-base font-medium tracking-[0.16em] text-slate-400">
            BDT
          </span>
        </p>
        <p className="mt-3 max-w-xl font-rajdhani text-base leading-snug tracking-wide text-slate-300">
          One-time registration fee. Membership lasts through your HSC years.
          Some workshops and events may carry a separate fee.
        </p>

        <div className="mt-6">
          {formUrl ? (
            <Button href={formUrl} target="_blank" rel="noopener noreferrer" size="md">
              Become a Member
              <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
            </Button>
          ) : (
            <>
              <Button type="button" size="md" disabled>
                Membership closed
              </Button>
              <p className="mt-3 max-w-xl font-rajdhani text-sm text-slate-400">
                Membership is closed right now. The club will publish the form
                here when enrolment opens.
              </p>
            </>
          )}
        </div>

        {formUrl ? (
          <p className="mt-3 font-rajdhani text-xs text-slate-500">
            Takes about two minutes.
          </p>
        ) : null}
      </section>
    </DashboardShell>
  );
}
