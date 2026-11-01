"use client";

import {
  ArrowUpRight,
  Newspaper,
  Shield,
  Trophy,
  Users,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import PageHeader from "@/components/admin/PageHeader";
import Button from "@/components/ui/Button";
import { apiFetch } from "@/lib/api";
import type { Achievement, Admin, Intel, Leader } from "@/lib/api-types";

type CountState =
  | { status: "loading" }
  | { status: "ok"; value: number }
  | { status: "error" };

type Counts = {
  leadership: CountState;
  achievements: CountState;
  intel: CountState;
};

export default function AdminHome() {
  const [admin, setAdmin] = useState<Admin | null>(null);
  const [counts, setCounts] = useState<Counts>({
    leadership: { status: "loading" },
    achievements: { status: "loading" },
    intel: { status: "loading" },
  });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [me, leaders, achievements, intels] = await Promise.all([
        apiFetch<Admin>("/admin/auth/me").catch(() => null),
        apiFetch<Leader[]>("/admin/leadership").catch(() => null),
        apiFetch<Achievement[]>("/admin/achievements").catch(() => null),
        apiFetch<Intel[]>("/admin/intels").catch(() => null),
      ]);
      if (cancelled) return;
      if (me) setAdmin(me);
      setCounts({
        leadership: leaders
          ? { status: "ok", value: leaders.length }
          : { status: "error" },
        achievements: achievements
          ? { status: "ok", value: achievements.length }
          : { status: "error" },
        intel: intels ? { status: "ok", value: intels.length } : { status: "error" },
      });
    })();
    return () => {
      cancelled = true;
    };
  }, [attempt]);

  const hasCountError = Object.values(counts).some(
    (count) => count.status === "error"
  );

  const cards = [
    {
      href: "/admin/leadership",
      label: "Leadership",
      icon: Users,
      value: counts.leadership,
      note: "Members listed on the public panel",
    },
    {
      href: "/admin/achievements",
      label: "Achievements",
      icon: Trophy,
      value: counts.achievements,
      note: "Stories in the achievement archive",
    },
    {
      href: "/admin/intels",
      label: "Intel",
      icon: Newspaper,
      value: counts.intel,
      note: "Published articles and updates",
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Console"
        title="Overview"
        description="The working surface for the public site. Content you change here appears on dcitc.org after the next refresh."
        actions={
          <Button href="/" target="_blank" rel="noopener noreferrer" variant="secondary" size="sm">
            View site
            <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
          </Button>
        }
      />

      <div className="grid gap-3 sm:grid-cols-3">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <Link
              key={card.href}
              href={card.href}
              className="group relative flex flex-col justify-between border border-white/10 bg-white/[0.02] p-5 transition-all hover:border-white/35 hover:bg-white/[0.05] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
              <div className="flex items-start justify-between">
                <span className="flex h-9 w-9 items-center justify-center border border-white/15 text-slate-400 transition-colors group-hover:border-white/40 group-hover:text-white">
                  <Icon className="h-4 w-4" aria-hidden="true" />
                </span>
                <ArrowUpRight
                  className="h-4 w-4 text-slate-700 transition-all group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-white"
                  aria-hidden="true"
                />
              </div>
              <div className="mt-8">
                <p className="font-orbitron text-3xl font-bold text-white">
                  {card.value.status === "loading" ? (
                    <span className="inline-block h-8 w-12 animate-pulse bg-white/10 align-middle" />
                  ) : card.value.status === "error" ? (
                    <span className="font-rajdhani text-base font-semibold uppercase tracking-[0.12em] text-slate-500">
                      Unavailable
                    </span>
                  ) : (
                    card.value.value
                  )}
                </p>
                <p className="mt-1 font-orbitron text-[10px] uppercase tracking-[0.18em] text-slate-400">
                  {card.label}
                </p>
                <p className="mt-1 font-rajdhani text-xs leading-snug text-slate-500">
                  {card.note}
                </p>
              </div>
            </Link>
          );
        })}
      </div>

      {hasCountError ? (
        <div className="flex flex-wrap items-center gap-3">
          <p className="font-rajdhani text-sm text-slate-500">
            Some counts could not be loaded.
          </p>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => {
              setCounts({
                leadership: { status: "loading" },
                achievements: { status: "loading" },
                intel: { status: "loading" },
              });
              setAttempt((value) => value + 1);
            }}
          >
            Retry
          </Button>
        </div>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-5">
        <section className="border border-white/10 bg-white/[0.02] p-5 sm:p-6 lg:col-span-3">
          <p className="font-orbitron text-[10px] uppercase tracking-[0.24em] text-slate-500">
            Quick actions
          </p>
          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            <Button href="/admin/leadership" variant="secondary" fullWidth>
              Manage leadership
            </Button>
            <Button href="/admin/achievements" variant="secondary" fullWidth>
              Feature an achievement
            </Button>
            <Button href="/admin/intels" variant="secondary" fullWidth>
              Publish intel
            </Button>
            <Button href="/admin/settings" variant="secondary" fullWidth>
              Edit membership link
            </Button>
          </div>
        </section>

        <section className="border border-white/10 bg-white/[0.02] p-5 sm:p-6 lg:col-span-2">
          <p className="font-orbitron text-[10px] uppercase tracking-[0.24em] text-slate-500">
            Session
          </p>
          <div className="mt-4 flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center border border-white/15 bg-white/[0.05] font-orbitron text-xs text-white">
              {(admin?.name ?? "AD").slice(0, 2).toUpperCase()}
            </span>
            <div className="min-w-0">
              <p className="truncate font-rajdhani text-base font-semibold text-white">
                {admin?.name ?? "Operator"}
              </p>
              <span className="mt-0.5 inline-flex items-center gap-1 border border-white/15 px-1.5 py-0.5 font-orbitron text-[8px] uppercase tracking-[0.14em] text-slate-400">
                <Shield className="h-2.5 w-2.5" aria-hidden="true" />
                {admin?.role === "super_admin" ? "Super admin" : "Admin"}
              </span>
            </div>
          </div>
          <p className="mt-4 border-t border-white/5 pt-4 font-rajdhani text-xs leading-snug text-slate-500">
            {admin?.role === "super_admin"
              ? "You can also manage operator accounts and read the audit log."
              : "Operator accounts and audit history are managed by a super admin."}
          </p>
        </section>
      </div>
    </div>
  );
}
