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
      <div className=" bg-white/15 p-px shadow-elev-2">
        <div className=" relative bg-surface/95 px-5 py-7 backdrop-blur-md sm:px-8 sm:py-9">
          <span
            aria-hidden="true"
            className="absolute left-0 top-9 h-10 w-px bg-white/40"
          />
          {eyebrow ? (
            <p className="mb-3 type-overline uppercase tracking-[0.3em] text-faint">
              {eyebrow}
            </p>
          ) : null}
          <h1 className="type-h3 font-bold leading-tight tracking-tight text-text sm:text-3xl">
            {title}
          </h1>
          {subtitle ? (
            <p className="mt-2 type-body leading-snug tracking-wide text-subtle">
              {subtitle}
            </p>
          ) : null}
          <div className="mt-6">{children}</div>
        </div>
      </div>
    </div>
  );
}
