export default function AuthCard({
  eyebrow,
  title,
  subtitle,
  children,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="enter-rise w-full max-w-[440px]">
      <div className="border border-line bg-line p-px shadow-elev-2">
        <div className="relative bg-surface px-5 py-7 sm:px-8 sm:py-9">
          <span
            aria-hidden="true"
            className="absolute left-0 top-9 h-10 w-px bg-accent"
          />
          {eyebrow ? (
            <p className="type-overline mb-3 text-accent">
              {eyebrow}
            </p>
          ) : null}
          <h1 className="type-h2">
            {title}
          </h1>
          {subtitle ? (
            <p className="type-body-sm mt-2 text-subtle">
              {subtitle}
            </p>
          ) : null}
          <div className="mt-6">{children}</div>
        </div>
      </div>
    </div>
  );
}
