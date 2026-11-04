export default function PageHeader({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-4 border-b border-line pb-5 sm:flex-row sm:items-end sm:justify-between">
      <div>
        {eyebrow ? (
          <p className="mb-1.5 font-orbitron text-3xs uppercase tracking-[0.28em] text-faint">
            {eyebrow}
          </p>
        ) : null}
        <h1 className="font-orbitron text-xl font-bold tracking-tight text-text sm:text-2xl">
          {title}
        </h1>
        {description ? (
          <p className="mt-1.5 max-w-xl font-rajdhani text-sm leading-snug text-subtle">
            {description}
          </p>
        ) : null}
      </div>
      {actions ? <div className="flex shrink-0 gap-2">{actions}</div> : null}
    </div>
  );
}
