import Link from "next/link";
import Logo from "../ui/Logo";

export default function AuthLayout({
  children,
  panelEyebrow = "Member portal",
  panelNote = "One account for club membership, events, and the work coming out of Dhaka College's technology community.",
}: {
  children: React.ReactNode;
  panelEyebrow?: string;
  panelNote?: string;
}) {
  return (
    <div className="relative min-h-screen bg-black text-slate-200 lg:grid lg:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)]">
      <aside className="relative hidden overflow-hidden border-r border-white/10 lg:flex lg:flex-col lg:justify-between lg:p-12 xl:p-16">
        <div className="tech-grid pointer-events-none absolute inset-0 opacity-40" />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-transparent via-black/20 to-black" />
        <div className="pointer-events-none absolute -left-28 top-1/3 h-80 w-80 rounded-full bg-white/[0.05] blur-[100px]" />
        <div className="pointer-events-none absolute -right-16 bottom-24 h-56 w-56 rounded-full bg-white/[0.04] blur-[90px]" />

        <div className="relative z-10">
          <Logo />
        </div>

        <div className="relative z-10 max-w-md">
          <p className="mb-5 font-orbitron text-[10px] uppercase tracking-[0.34em] text-slate-500">
            {panelEyebrow}
          </p>
          <h2 className="font-orbitron text-4xl font-bold leading-[1.08] tracking-tight text-white xl:text-5xl">
            SHAPING
            <br />
            <span className="text-transparent bg-clip-text bg-linear-to-r from-white via-slate-300 to-slate-600">
              TOMORROW
            </span>
            <br />
            TODAY
          </h2>
          <p className="mt-6 max-w-sm font-rajdhani text-lg leading-relaxed tracking-wide text-slate-400">
            {panelNote}
          </p>
        </div>

        <div className="relative z-10 font-rajdhani text-xs tracking-wide text-slate-500">
          <span>Dhaka College Information &amp; Technology Club</span>
        </div>
      </aside>

      <div className="relative flex min-h-screen flex-col">
        <header className="flex items-center justify-between border-b border-white/10 px-5 py-3 lg:hidden">
          <Logo />
          <Link
            href="/"
            className="font-orbitron text-[10px] uppercase tracking-[0.18em] text-slate-400 transition-colors hover:text-white"
          >
            Home
          </Link>
        </header>

        <div className="hidden justify-end px-8 pt-8 lg:flex">
          <Link
            href="/"
            className="group inline-flex items-center gap-2 font-rajdhani text-sm tracking-wide text-slate-500 transition-colors hover:text-white"
          >
            <span aria-hidden="true" className="transition-transform group-hover:-translate-x-0.5">
              &larr;
            </span>
            Back to site
          </Link>
        </div>

        <main className="flex flex-1 items-center justify-center px-4 py-8 sm:px-8 lg:py-10">
          {children}
        </main>

        <div className="pb-6 text-center lg:hidden">
          <Link
            href="/"
            className="font-rajdhani text-sm tracking-wide text-slate-500 transition-colors hover:text-white"
          >
            &larr; Back to site
          </Link>
        </div>
      </div>
    </div>
  );
}
