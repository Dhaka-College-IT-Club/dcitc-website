"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { Menu, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { usePathname } from "next/navigation";
import { NAV_ITEMS, CLUB } from "../constants";

const Logo: React.FC = () => (
  <Link href="/" className="flex items-center gap-3 group relative z-10">
    <div className="relative w-20 h-20 sm:w-20 sm:h-20 md:w-24 md:h-24 transition-all duration-300 -my-2">
      <Image
        src="/logo.png"
        alt={`${CLUB.SHORT} Logo`}
        width={200}
        height={200}
        priority
        className="object-contain"
      />
    </div>
  </Link>
);

interface DesktopNavProps {
  pathname: string;
}

const DesktopNav: React.FC<DesktopNavProps> = ({ pathname }) => (
  <div className="hidden md:flex items-center gap-8">
    {NAV_ITEMS.map((item) => {
      const isActive = item.href === "/"
        ? pathname === "/"
        : pathname === item.href || pathname.startsWith(`${item.href}/`);
      return (
        <a
          key={item.label}
          href={item.href}
          className={`font-rajdhani font-semibold text-lg transition-colors relative group tracking-wider ${isActive ? "text-white" : "text-slate-400 hover:text-white"
            }`}
        >
          {item.label}
          <span className={`absolute -bottom-1 left-0 h-0.5 bg-white transition-all ${isActive ? "w-full" : "w-0 group-hover:w-full"}`}></span>
        </a>
      );
    })}

    <LoginButton />
    <ApplyButton />
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

const ApplyButton: React.FC = () => (
  <a
    href="/signup"
    className="px-6 py-2 bg-white/10 hover:bg-white/20 border border-white/20 text-white font-orbitron text-sm tracking-wider rounded-none backdrop-blur-sm transition-all hover:shadow-[0_0_15px_rgba(255,255,255,0.3)] -skew-x-10"
  >
    <span className="skew-x-10 inline-block cursor-pointer">JOIN DCITC</span>
  </a>
);

const LoginButton: React.FC = () => (
  <a
    href="/login"
    className="px-6 py-2 border border-white/20 text-slate-300 hover:text-white hover:border-white/40 font-orbitron text-sm tracking-wider rounded-none transition-all -skew-x-10"
  >
    <span className="skew-x-10 inline-block cursor-pointer">LOGIN</span>
  </a>
);

interface MobileNavMenuProps {
  top: string;
  onClose: () => void;
  pathname: string;
}

const MobileNavMenu: React.FC<MobileNavMenuProps> = ({
  top,
  onClose,
  pathname,
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
          <a
            key={item.label}
            href={item.href}
            onClick={onClose}
            className={`font-rajdhani font-bold text-2xl border-b border-white/10 pb-3 last:border-b-0 transition-colors tracking-wider ${isActive ? "text-white" : "text-slate-200 hover:text-white"
              }`}
          >
            {item.label}
          </a>
        );
      })}
      <LoginButton />
    <ApplyButton />
    </div>
  </motion.div>
);

const Navbar: React.FC = () => {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

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

  const mobileMenuTop = `3.5rem`;

  return (
    <nav
      className={`bg-black fixed w-full z-50 transition-all duration-300 glass-panel border-b border-white/10`}
    >
      <div className="max-w-7xl mx-auto px-6 py-1 sm:py-0 flex justify-between items-center">
        <Logo />

        <DesktopNav pathname={pathname} />

        <MobileMenuButton isOpen={isOpen} setIsOpen={setIsOpen} />
      </div>

      <AnimatePresence>
        {isOpen && (
          <MobileNavMenu
            top={mobileMenuTop}
            onClose={() => setIsOpen(false)}
            pathname={pathname}
          />
        )}
      </AnimatePresence>
    </nav>
  );
};

export default Navbar;
