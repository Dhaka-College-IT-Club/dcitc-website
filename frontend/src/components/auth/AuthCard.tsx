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
      <div className="clip-notch bg-white/15 p-px shadow-[0_24px_80px_-24px_rgba(0,0,0,0.9)]">
        <div className="clip-notch relative bg-[#050505]/95 px-5 py-7 backdrop-blur-md sm:px-8 sm:py-9">
          <span
            aria-hidden="true"
            className="absolute left-0 top-9 h-10 w-px bg-white/40"
          />
          {eyebrow ? (
            <p className="mb-3 font-orbitron text-[10px] uppercase tracking-[0.3em] text-slate-500">
              {eyebrow}
            </p>
          ) : null}
          <h1 className="font-orbitron text-2xl font-bold leading-tight tracking-tight text-white sm:text-[27px]">
            {title}
          </h1>
          {subtitle ? (
            <p className="mt-2 font-rajdhani text-base leading-snug tracking-wide text-slate-400">
              {subtitle}
            </p>
          ) : null}
          <div className="mt-6">{children}</div>
        </div>
      </div>
    </div>
  );
}
