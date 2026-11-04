import type { ReactNode } from "react";

/** One section rhythm: 64px on mobile, 96px on desktop, optional hairline seam. */
export function Section({
  id,
  seam = false,
  className = "",
  children,
}: {
  id?: string;
  seam?: boolean;
  className?: string;
  children: ReactNode;
}) {
  return (
    <section
      id={id}
      className={[
        "relative py-16 md:py-24",
        seam ? "section-seam" : "",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {children}
    </section>
  );
}

/** One container: 1200px, 24px gutter. */
export function Container({
  className = "",
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={`mx-auto w-full max-w-[1200px] px-6 ${className}`}>
      {children}
    </div>
  );
}
