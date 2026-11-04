import type { ReactNode } from "react";

/**
 * The one card recipe: surface fill, 1px line, 24px padding, and a hover
 * state that only shifts the border and lifts 2px. No shadow, no fill jump.
 */
export default function Card({
  as: Tag = "div",
  interactive = false,
  className = "",
  children,
}: {
  as?: "div" | "article" | "li";
  interactive?: boolean;
  className?: string;
  children: ReactNode;
}) {
  return (
    <Tag
      className={[
        "relative border border-line bg-surface p-6",
        interactive
          ? "transition-colors duration-200 hover:border-line-strong hover:bg-surface-2"
          : "",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {children}
    </Tag>
  );
}
