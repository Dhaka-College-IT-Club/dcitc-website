"use client";
import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, usePathname } from "next/navigation";
import { LayoutDashboard, LogOut, Menu, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { NAV_ITEMS } from "../constants";
import { apiFetch } from "@/lib/api";
import type { User } from "@/lib/api-types";
import { initials } from "@/lib/initials";
import ConfirmDialog from "./ui/ConfirmDialog";

type AuthState =
  | { status: "loading" }
  | { status: "out" }
  | { status: "in"; user: User };

const Logo: React.FC = () => (
  <Link
    href="/"
    aria-label="Dhaka College IT Club - Home"
    className="flex items-center gap-3 group relative z-10"
  >
    <div className="relative w-20 h-20 sm:w-20 sm:h-20 md:w-24 md:h-24 transition-all duration-300 -my-2">
      <Image
        src="/logo.png"
        alt="Dhaka College IT Club logo"
        width={200}
        height={200}
        priority
        className="object-contain"
      />
    </div>
  </Link>
);

const ApplyButton: React.FC = () => (
  <Link
    href="/signup"
    className="px-6 py-2 bg-white/10 hover:bg-white/20 border border-white/20 text-white font-orbitron text-sm tracking-wider rounded-none backdrop-blur-sm transition-all hover:shadow-[0_0_15px_rgba(255,255,255,0.3)] -skew-x-10"
  >
    <span className="skew-x-10 inline-block cursor-pointer">JOIN DCITC</span>
  </Link>
);

const LoginButton: React.FC = () => (
  <Link
    href="/login"
    className="px-6 py-2 border border-white/20 text-slate-300 hover:text-white hover:border-white/40 font-orbitron text-sm tracking-wider rounded-none transition-all -skew-x-10"
  >
    <span className="skew-x-10 inline-block cursor-pointer">LOGIN</span>
  </Link>
);

interface AccountMenuProps {
  user: User;
  signingOut: boolean;
  onLogout: () => void;
}

const AccountMenu: React.FC<AccountMenuProps> = ({ user, signingOut, onLogout }) => {
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    function onPointerDown(event: MouseEvent) {
      if (!wrapperRef.current?.contains(event.target as Node)) setOpen(false);
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
        buttonRef.current?.focus();
      }
    }
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <div ref={wrapperRef} className="relative">
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`Account menu for ${user.name}`}
        title={user.name}
        className="flex h-9 w-9 items-center justify-center rounded-full border border-white/30 bg-white/10 font-orbitron text-[11px] tracking-wide text-white transition-colors hover:bg-white/20 hover:border-white/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
      >
        {initials(user.name)}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            role="menu"
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-full z-50 mt-3 w-44 border border-white/15 bg-black shadow-xl"
          >
            <Link
              href="/dashboard"
              role="menuitem"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 px-4 py-3 font-rajdhani font-semibold text-base tracking-wide text-slate-200 transition-colors hover:bg-white/10 hover:text-white"
            >
              <LayoutDashboard className="h-4 w-4" aria-hidden="true" />
              Dashboard
            </Link>
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                setOpen(false);
                onLogout();
              }}
              disabled={signingOut}
              className="flex w-full items-center gap-2.5 border-t border-white/10 px-4 py-3 text-left font-rajdhani font-semibold text-base tracking-wide text-slate-200 transition-colors hover:bg-white/10 hover:text-white disabled:opacity-50"
            >
              <LogOut className="h-4 w-4" aria-hidden="true" />
              {signingOut ? "Logging out…" : "Log out"}
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

interface AuthControlsProps {
  auth: AuthState;
  signingOut: boolean;
  onLogout: () => void;
}

const AuthControls: React.FC<AuthControlsProps> = ({ auth, signingOut, onLogout }) => {
  if (auth.status === "loading") {
    return <span className="block h-9 w-[250px] animate-pulse bg-white/10" aria-hidden="true" />;
  }
  if (auth.status === "in") {
    return <AccountMenu user={auth.user} signingOut={signingOut} onLogout={onLogout} />;
  }
  return (
    <>
      <LoginButton />
      <ApplyButton />
    </>
  );
};

interface DesktopNavProps {
  pathname: string;
  auth: AuthState;
  signingOut: boolean;
  onLogout: () => void;
}

const DesktopNav: React.FC<DesktopNavProps> = ({ pathname, auth, signingOut, onLogout }) => (
  <div className="hidden md:flex items-center gap-8">
    {NAV_ITEMS.map((item) => {
      const isActive = item.href === "/"
        ? pathname === "/"
        : pathname === item.href || pathname.startsWith(`${item.href}/`);
      return (
        <Link
          key={item.label}
          href={item.href}
          className={`font-rajdhani font-semibold text-lg transition-colors relative group tracking-wider ${isActive ? "text-white" : "text-slate-400 hover:text-white"
            }`}
        >
          {item.label}
          <span className={`absolute -bottom-1 left-0 h-0.5 bg-white transition-all ${isActive ? "w-full" : "w-0 group-hover:w-full"}`}></span>
        </Link>
      );
    })}

    <AuthControls auth={auth} signingOut={signingOut} onLogout={onLogout} />
  </div>
);

interface MobileMenuButtonProps {
  isOpen: boolean;
  setIsOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

const MobileMenuButton: React.FC<MobileMenuButtonProps> = ({
  isOpen,
  setIsOpen,
}) => (
  <button
    className="md:hidden text-white z-[60] relative"
    onClick={() => setIsOpen(!isOpen)}
    aria-label={isOpen ? "Close menu" : "Open menu"}
  >
    {isOpen ? <X className="w-8 h-8" /> : <Menu className="w-8 h-8" />}
  </button>
);

interface MobileNavMenuProps {
  top: string;
  onClose: () => void;
  pathname: string;
  auth: AuthState;
  signingOut: boolean;
  onLogout: () => void;
}

const MobileNavMenu: React.FC<MobileNavMenuProps> = ({
  top,
  onClose,
  pathname,
  auth,
  signingOut,
  onLogout,
}) => (
  <motion.div
    initial={{ opacity: 0, y: -20 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -20 }}
    transition={{ duration: 0.2 }}
    style={{ top, height: `calc(100vh - ${top})` }}
    className="md:hidden fixed left-0 w-full bg-black border-t border-white/10 shadow-xl overflow-y-auto"
  >
    <div className="flex flex-col p-6 gap-6">
      {NAV_ITEMS.map((item) => {
        const isActive = item.href === "/"
          ? pathname === "/"
          : pathname === item.href || pathname.startsWith(`${item.href}/`);
        return (
          <Link
            key={item.label}
            href={item.href}
            onClick={onClose}
            className={`font-rajdhani font-bold text-2xl border-b border-white/10 pb-3 last:border-b-0 transition-colors tracking-wider ${isActive ? "text-white" : "text-slate-200 hover:text-white"
              }`}
          >
            {item.label}
          </Link>
        );
      })}

      {auth.status === "loading" ? (
        <span className="block h-9 w-full animate-pulse bg-white/10" aria-hidden="true" />
      ) : auth.status === "in" ? (
        <div className="flex flex-col gap-6">
          <Link
            href="/dashboard"
            onClick={onClose}
            className="font-rajdhani font-bold text-2xl tracking-wider text-slate-200 transition-colors hover:text-white"
          >
            Dashboard
          </Link>
          <button
            type="button"
            onClick={onLogout}
            disabled={signingOut}
            className="text-left font-rajdhani font-bold text-2xl tracking-wider text-slate-200 transition-colors hover:text-white disabled:opacity-50"
          >
            {signingOut ? "Logging out…" : "Log out"}
          </button>
        </div>
      ) : (
        <>
          <LoginButton />
          <ApplyButton />
        </>
      )}
    </div>
  </motion.div>
);

const Navbar: React.FC = () => {
  const router = useRouter();
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [auth, setAuth] = useState<AuthState>({ status: "loading" });
  const [signingOut, setSigningOut] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const user = await apiFetch<User>("/auth/me");
        if (!cancelled) setAuth({ status: "in", user });
      } catch {
        if (!cancelled) setAuth({ status: "out" });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      document.body.style.position = "fixed";
      document.body.style.width = "100%";
    } else {
      document.body.style.overflow = "auto";
      document.body.style.position = "";
      document.body.style.width = "";
    }
  }, [isOpen]);

  async function logout() {
    if (signingOut) return;
    setSigningOut(true);
    try {
      await apiFetch("/auth/logout", { method: "POST" });
    } catch {
      /* ignore — the session is dropped client-side either way */
    }
    setAuth({ status: "out" });
    setSigningOut(false);
    setIsOpen(false);
    router.replace("/");
  }

  /** Close whichever menu held the trigger, then ask before ending the session. */
  function requestLogout() {
    setIsOpen(false);
    setConfirmOpen(true);
  }

  const mobileMenuTop = `3.5rem`;

  return (
    <>
      <nav
        className={`bg-black fixed w-full z-50 transition-all duration-300 glass-panel border-b border-white/10`}
      >
        <div className="max-w-7xl mx-auto px-6 py-1 sm:py-0 flex justify-between items-center">
          <Logo />

          <DesktopNav
            pathname={pathname}
            auth={auth}
            signingOut={signingOut}
            onLogout={requestLogout}
          />

          <MobileMenuButton isOpen={isOpen} setIsOpen={setIsOpen} />
        </div>

        <AnimatePresence>
          {isOpen && (
            <MobileNavMenu
              top={mobileMenuTop}
              onClose={() => setIsOpen(false)}
              pathname={pathname}
              auth={auth}
              signingOut={signingOut}
              onLogout={requestLogout}
            />
          )}
        </AnimatePresence>
      </nav>

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
          void logout();
        }}
        onCancel={() => setConfirmOpen(false)}
      />
    </>
  );
};

export default Navbar;
