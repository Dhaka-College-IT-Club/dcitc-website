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
          <p className="type-overline mb-1.5 text-accent">
            {eyebrow}
          </p>
        ) : null}
        <h1 className="type-h3 font-bold tracking-tight text-text">
          {title}
        </h1>
        {description ? (
          <p className="mt-1.5 max-w-xl type-body-sm leading-snug text-subtle">
            {description}
          </p>
        ) : null}
      </div>
      {actions ? <div className="flex shrink-0 gap-2">{actions}</div> : null}
    </div>
  );
}
