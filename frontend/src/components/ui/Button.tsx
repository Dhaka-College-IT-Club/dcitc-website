import { Loader2 } from "lucide-react";
import Link from "next/link";
import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from "react";

const variants = {
  primary: "bg-white text-black hover:bg-slate-200 hover:shadow-glow",
  secondary:
    "border border-line-strong bg-surface text-text hover:border-accent/60 hover:bg-surface-2",
  ghost: "text-subtle hover:text-text hover:bg-surface",
  danger:
    "border border-danger/40 bg-danger/10 text-danger hover:border-danger/60 hover:bg-danger/15",
};

const sizes = {
  sm: "h-10 px-4",
  md: "h-12 px-6",
};

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

/**
 * The only button in the system. Parallelogram edge at a single angle, label
 * counter-skewed, one accent focus ring inherited from globals.css.
 */
export default function Button({
  variant = "primary",
  size = "md",
  loading = false,
  fullWidth = false,
  skew = true,
  href,
  target,
  rel,
  className = "",
  children,
  disabled,
  ...props
}: ButtonProps) {
  const classes = [
    "inline-flex items-center justify-center type-button whitespace-nowrap",
    "transition-[background-color,border-color,color,box-shadow] duration-200",
    "disabled:cursor-not-allowed disabled:opacity-45",
    variants[variant],
    sizes[size],
    fullWidth ? "w-full" : "",
    skew ? "edge-skew" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  const content = (
    <span className="inline-flex items-center justify-center gap-2">
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
      ) : null}
      {children}
    </span>
  );

  if (href) {
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
