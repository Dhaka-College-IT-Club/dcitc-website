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
    <div className="min-h-screen bg-bg text-muted">
      <header className="sticky top-0 z-30 border-b border-line bg-bg/90 backdrop-blur">
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
              className="whitespace-nowrap type-overline uppercase tracking-[0.14em] text-subtle transition-colors hover:text-text"
            >
              Back to site
            </Link>
            <span
              className="flex h-9 w-9 items-center justify-center border border-line-strong bg-surface-2 type-overline text-text"
              title={user.name}
            >
              <span aria-hidden="true">{initials(user.name)}</span>
              <span className="sr-only">{user.name}</span>
            </span>
            <button
              type="button"
              onClick={() => setConfirmOpen(true)}
              disabled={signingOut}
              className="inline-flex h-9 items-center gap-1.5 border border-line-strong px-2.5 type-overline uppercase tracking-[0.14em] text-subtle transition-colors hover:border-line-strong/40 hover:text-text disabled:opacity-50 sm:px-3 sm:text-3xs"
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
