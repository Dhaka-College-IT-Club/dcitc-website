"use client";

import { LogOut } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import type { User } from "@/lib/api-types";
import { initials } from "@/lib/initials";
import ConfirmDialog from "../ui/ConfirmDialog";
import Logo from "../ui/Logo";

export default function DashboardShell({
  user,
  onLogout,
  signingOut,
  children,
}: {
  user: User;
  onLogout: () => void;
  signingOut?: boolean;
  children: React.ReactNode;
}) {
  const [confirmOpen, setConfirmOpen] = useState(false);

  return (
    <div className="min-h-screen bg-black text-slate-200">
      <header className="sticky top-0 z-30 border-b border-white/10 bg-black/90 backdrop-blur">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <span className="sm:hidden">
            <Logo compact />
          </span>
          <span className="hidden sm:block">
            <Logo />
          </span>
          <div className="flex items-center gap-2.5 sm:gap-4">
            <Link
              href="/"
              className="whitespace-nowrap font-orbitron text-[9px] uppercase tracking-[0.14em] text-slate-400 transition-colors hover:text-white"
            >
              Back to site
            </Link>
            <span
              className="flex h-9 w-9 items-center justify-center border border-white/20 bg-white/[0.06] font-orbitron text-[11px] text-white"
              title={user.name}
            >
              <span aria-hidden="true">{initials(user.name)}</span>
              <span className="sr-only">{user.name}</span>
            </span>
            <button
              type="button"
              onClick={() => setConfirmOpen(true)}
              disabled={signingOut}
              className="inline-flex h-9 items-center gap-1.5 border border-white/15 px-2.5 font-orbitron text-[9px] uppercase tracking-[0.14em] text-slate-400 transition-colors hover:border-white/40 hover:text-white disabled:opacity-50 sm:px-3 sm:text-[10px]"
            >
              <LogOut className="h-3.5 w-3.5" aria-hidden="true" />
              <span className="hidden sm:inline">Log out</span>
              <span className="sr-only sm:hidden">Log out</span>
            </button>
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 sm:py-10">
        {children}
      </main>

      <ConfirmDialog
        open={confirmOpen}
        title="Log out?"
        description="You'll need to sign in again to reach your dashboard."
        confirmLabel="Log out"
        cancelLabel="Cancel"
        destructive={false}
        pending={signingOut}
        onConfirm={() => {
          setConfirmOpen(false);
          onLogout();
        }}
        onCancel={() => setConfirmOpen(false)}
      />
    </div>
  );
}
