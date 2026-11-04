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
    <div className="relative min-h-screen bg-bg text-muted lg:grid lg:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)]">
      <aside className="relative hidden overflow-hidden border-r border-line lg:flex lg:flex-col lg:justify-between lg:p-12 xl:p-16">
        <div className="tech-grid pointer-events-none absolute inset-0 opacity-40" />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-transparent via-bg/20 to-bg" />
        <div className="pointer-events-none absolute -left-28 top-1/3 h-80 w-80 rounded-full bg-surface-2 blur-[100px]" />
        <div className="pointer-events-none absolute -right-16 bottom-24 h-56 w-56 rounded-full bg-surface-2 blur-[90px]" />

        <div className="relative z-10">
          <Logo />
        </div>

        <div className="relative z-10 max-w-md">
          <p className="type-overline mb-5 text-accent">
            {panelEyebrow}
          </p>
          <h2 className="type-display">
            SHAPING
            <br />
            <span className="text-accent">
              TOMORROW
            </span>
            <br />
            TODAY
          </h2>
          <p className="type-body mt-6 max-w-sm text-subtle">
            {panelNote}
          </p>
        </div>

        <div className="type-caption relative z-10 text-faint">
          <span>Dhaka College Information &amp; Technology Club</span>
        </div>
      </aside>

      <div className="relative flex min-h-screen flex-col">
        <header className="flex items-center justify-between border-b border-line px-5 py-3 lg:hidden">
          <Logo />
          <Link
            href="/"
            className="type-overline text-subtle transition-colors hover:text-accent"
          >
            Home
          </Link>
        </header>

        <div className="hidden justify-end px-8 pt-8 lg:flex">
          <Link
            href="/"
            className="group inline-flex items-center gap-2 type-body-sm text-subtle transition-colors hover:text-accent"
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
            className="type-body-sm tracking-wide text-faint transition-colors hover:text-text"
          >
            &larr; Back to site
          </Link>
        </div>
      </div>
    </div>
  );
}
