interface SectionTitleProps {
  title: string;
  subtitle?: string;
  eyebrow?: string;
  align?: "left" | "center" | "right";
  className?: string;
}

/** Section heading: eyebrow, h2, accent rule, subtitle. Nothing else. */
export default function SectionTitle({
  title,
  subtitle,
  eyebrow,
  align = "center",
  className = "",
}: SectionTitleProps) {
  const alignment =
    align === "left"
      ? "text-left items-start"
      : align === "right"
        ? "text-right items-end"
        : "text-center items-center";

  return (
    <div className={`flex flex-col ${alignment} ${className}`}>
      {eyebrow ? (
        <p className="type-overline mb-3 text-accent">{eyebrow}</p>
      ) : null}
      <h2 className="type-h2 uppercase tracking-wide">{title}</h2>
      <span
        aria-hidden="true"
        className="mt-4 block h-px w-16 bg-accent/60"
      />
      {subtitle ? (
        <p className="type-body mt-4 max-w-2xl text-subtle">{subtitle}</p>
      ) : null}
    </div>
  );
}
