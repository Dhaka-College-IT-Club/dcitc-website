"use client";

import {
  LayoutDashboard,
  LogOut,
  Menu,
  Newspaper,
  ScrollText,
  Settings,
  Shield,
  Trophy,
  UserCog,
  Users,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import type { Admin } from "@/lib/api-types";
import Logo from "../ui/Logo";
import Drawer from "../ui/Drawer";
import ConfirmDialog from "../ui/ConfirmDialog";
import { ToastProvider } from "../ui/Toast";

const contentLinks = [
  { href: "/admin", label: "Overview", icon: LayoutDashboard },
  { href: "/admin/leadership", label: "Leadership", icon: Users },
  { href: "/admin/achievements", label: "Achievements", icon: Trophy },
  { href: "/admin/intels", label: "Intel", icon: Newspaper },
  { href: "/admin/settings", label: "Settings", icon: Settings },
];

const superLinks = [
  { href: "/admin/admins", label: "Admins", icon: UserCog },
  { href: "/admin/audit-log", label: "Audit log", icon: ScrollText },
];

function initials(value: string) {
  return value.trim().slice(0, 2).toUpperCase() || "AD";
}

function NavLinks({
  admin,
  onNavigate,
}: {
  admin: Admin;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const groups = [
    { label: "Content", links: contentLinks },
    ...(admin.role === "super_admin"
      ? [{ label: "System", links: superLinks }]
      : []),
  ];

  return (
    <nav className="flex-1 overflow-y-auto p-3">
      {groups.map((group) => (
        <div key={group.label} className="mb-5 last:mb-0">
          <p className="mb-2 px-3 type-overline uppercase tracking-[0.24em] text-faint">
            {group.label}
          </p>
          <ul className="space-y-1">
            {group.links.map((link) => {
              const active =
                link.href === "/admin"
                  ? pathname === "/admin"
                  : pathname.startsWith(link.href);
              const Icon = link.icon;
              return (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    onClick={onNavigate}
                    aria-current={active ? "page" : undefined}
                    className={`group relative flex items-center gap-2.5 px-3 py-2 type-body-sm tracking-wide transition-colors ${
                      active
                        ? "bg-surface-2 text-text"
                        : "text-subtle hover:bg-surface-2 hover:text-text"
                    }`}
                  >
                    <span
                      aria-hidden="true"
                      className={`absolute inset-y-1 left-0 w-0.5 ${
                        active ? "bg-accent" : "bg-transparent"
                      }`}
                    />
                    <Icon
                      className={`h-4 w-4 shrink-0 ${
                        active ? "text-text" : "text-faint group-hover:text-muted"
                      }`}
                      aria-hidden="true"
                    />
                    {link.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}

export default function AdminShell({
  admin,
  onLogout,
  children,
}: {
  admin: Admin;
  onLogout: () => void;
  children: React.ReactNode;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const isSuper = admin.role === "super_admin";

  /** Close the drawer first; the dialog lives on the shell so it survives it. */
  function requestLogout() {
    setMenuOpen(false);
    setConfirmOpen(true);
  }

  return (
    <ToastProvider>
      <div className="min-h-screen bg-bg text-muted">
        <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col border-r border-line bg-bg lg:flex">
          <div className="border-b border-line px-5 py-5">
            <Logo />
          </div>
          <NavLinks admin={admin} />
          <div className="border-t border-line p-3">
            <div className="flex items-center gap-2.5 px-2 py-2">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center border border-line-strong bg-surface-2 type-overline text-text">
                {initials(admin.name)}
              </span>
              <div className="min-w-0">
                <p className="truncate type-body-sm font-semibold text-text">
                  {admin.name}
                </p>
                <span className="mt-0.5 inline-flex items-center gap-1 border border-line-strong px-1.5 py-0.5 type-overline uppercase tracking-[0.14em] text-subtle">
                  <Shield className="h-2.5 w-2.5" aria-hidden="true" />
                  {isSuper ? "Super admin" : "Admin"}
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={requestLogout}
              className="mt-1 flex w-full items-center gap-2.5 px-3 py-2 type-body-sm text-faint transition-colors hover:bg-surface-2 hover:text-text"
            >
              <LogOut className="h-4 w-4" aria-hidden="true" />
              Log out
            </button>
          </div>
        </aside>

        <header className="sticky top-0 z-30 flex items-center justify-between border-b border-line bg-bg/90 px-4 py-3 backdrop-blur lg:hidden">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setMenuOpen(true)}
              className="inline-flex h-9 w-9 items-center justify-center border border-line-strong text-muted"
              aria-label="Open admin navigation"
              aria-expanded={menuOpen}
            >
              <Menu className="h-4 w-4" aria-hidden="true" />
            </button>
            <Logo compact />
            <span className="type-overline uppercase tracking-[0.2em] text-faint">
              Admin
            </span>
          </div>
          <span className="flex h-8 w-8 items-center justify-center border border-line-strong bg-surface-2 type-overline text-text">
            {initials(admin.name)}
          </span>
        </header>

        <div className="lg:pl-64">
          <main className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
            {children}
          </main>
        </div>

        <Drawer
          open={menuOpen}
          onClose={() => setMenuOpen(false)}
          title="Navigation"
          side="left"
          widthClassName="max-w-[300px]"
        >
          <div className="-mx-5 -mt-5 flex h-full flex-col">
            <div className="border-b border-line px-5 py-4">
              <Logo />
            </div>
            <NavLinks admin={admin} onNavigate={() => setMenuOpen(false)} />
            <div className="mt-auto border-t border-line p-3">
              <div className="flex items-center gap-2.5 px-2 py-2">
                <span className="flex h-9 w-9 items-center justify-center border border-line-strong bg-surface-2 type-overline text-text">
                  {initials(admin.name)}
                </span>
                <div className="min-w-0">
                  <p className="truncate type-body-sm font-semibold text-text">
                    {admin.name}
                  </p>
                  <p className="type-overline uppercase tracking-[0.14em] text-faint">
                    {isSuper ? "Super admin" : "Admin"}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={requestLogout}
                className="mt-1 flex w-full items-center gap-2.5 px-3 py-2 type-body-sm text-faint transition-colors hover:text-text"
              >
                <LogOut className="h-4 w-4" aria-hidden="true" />
                Log out
              </button>
            </div>
          </div>
        </Drawer>

        <ConfirmDialog
          open={confirmOpen}
          title="Log out?"
          description="You'll need to sign in again to manage the console."
          confirmLabel="Log out"
          cancelLabel="Cancel"
          destructive={false}
          onConfirm={() => {
            setConfirmOpen(false);
            onLogout();
          }}
          onCancel={() => setConfirmOpen(false)}
        />
      </div>
    </ToastProvider>
  );
}
