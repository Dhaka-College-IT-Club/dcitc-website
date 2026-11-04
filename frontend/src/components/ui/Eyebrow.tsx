import type { ReactNode } from "react";

export function Eyebrow({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <p className={`type-overline text-accent ${className}`}>{children}</p>
  );
}

export function Badge({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex items-center border border-accent/30 bg-accent-soft px-2.5 py-1 type-overline text-accent ${className}`}
    >
      {children}
    </span>
  );
}
