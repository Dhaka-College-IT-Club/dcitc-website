import { Loader2 } from "lucide-react";
import Link from "next/link";
import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from "react";

const variants = {
  primary:
    "bg-white text-black hover:bg-slate-200 hover:shadow-[0_0_22px_rgba(255,255,255,0.28)]",
  secondary:
    "border border-white/25 bg-white/[0.02] text-white hover:border-white/60 hover:bg-white/[0.07]",
  ghost: "text-slate-300 hover:bg-white/[0.06] hover:text-white",
  danger:
    "border border-red-500/40 bg-red-500/[0.06] text-red-300 hover:border-red-400/70 hover:bg-red-500/[0.12]",
};

const sizes = {
  sm: "h-9 px-3.5 text-[10px] tracking-[0.16em]",
  md: "h-11 px-6 text-[11px] tracking-[0.18em]",
  lg: "h-12 px-8 text-xs tracking-[0.2em]",
};

const skewed = new Set(["primary", "secondary"]);

type ButtonProps = {
  variant?: keyof typeof variants;
  size?: keyof typeof sizes;
  loading?: boolean;
  fullWidth?: boolean;
  skew?: boolean;
  href?: string;
  target?: string;
  rel?: string;
  className?: string;
  children: ReactNode;
} & Omit<ButtonHTMLAttributes<HTMLButtonElement>, "className" | "children">;

export default function Button({
  variant = "primary",
  size = "md",
  loading = false,
  fullWidth = false,
  skew,
  href,
  target,
  rel,
  className = "",
  children,
  disabled,
  ...props
}: ButtonProps) {
  const isSkewed = skew ?? skewed.has(variant);
  const classes = [
    "group relative inline-flex items-center justify-center border border-transparent font-orbitron font-bold uppercase",
    "transition-all duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white",
    "disabled:cursor-not-allowed disabled:opacity-45",
    variants[variant],
    sizes[size],
    fullWidth ? "w-full" : "",
    isSkewed ? "-skew-x-10" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  const content = (
    <span
      className={`inline-flex items-center justify-center gap-2 ${
        isSkewed ? "skew-x-10" : ""
      }`}
    >
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
      ) : null}
      {children}
    </span>
  );

  if (href) {
    // Link keeps internal routes client-side and hands external URLs to the browser.
    return (
      <Link
        href={href}
        target={target}
        rel={rel}
        className={classes}
        {...(props as AnchorHTMLAttributes<HTMLAnchorElement>)}
      >
        {content}
      </Link>
    );
  }

  return (
    <button
      {...props}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={classes}
    >
      {content}
    </button>
  );
}
