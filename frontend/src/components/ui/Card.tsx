import Link from "next/link";
import type {
  AnchorHTMLAttributes,
  HTMLAttributes,
  ReactNode,
} from "react";

/**
 * The one card recipe: surface fill, 1px line, spacing-scale padding, and a
 * hover state that only shifts the border and the surface. No shadow at rest.
 *
 * `href` renders the card as a link, the same way Button does.
 * `padding` takes spacing-scale padding classes only; the default is `p-6`.
 * `tick` draws the corner readout tick — public surfaces only.
 */
export default function Card({
  as: Tag = "div",
  interactive = false,
  tick = false,
  padding = "p-6",
  href,
  className = "",
  children,
  ...props
}: {
  as?: "div" | "article" | "li" | "section" | "aside";
  interactive?: boolean;
  tick?: boolean;
  padding?: string;
  href?: string;
  className?: string;
  children: ReactNode;
} & Omit<HTMLAttributes<HTMLElement>, "className" | "children">) {
  const classes = [
    "relative border border-line bg-surface",
    padding,
    tick ? "card-tick" : "",
    interactive
      ? "transition-colors duration-200 hover:border-line-strong hover:bg-surface-2"
      : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  if (href) {
    return (
      <Link
        href={href}
        className={classes}
        {...(props as AnchorHTMLAttributes<HTMLAnchorElement>)}
      >
        {children}
      </Link>
    );
  }

  return (
    <Tag className={classes} {...props}>
      {children}
    </Tag>
  );
}
