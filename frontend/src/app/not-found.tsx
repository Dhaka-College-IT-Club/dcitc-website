import Link from "next/link";
import Logo from "@/components/ui/Logo";

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-bg px-6 py-20 text-muted">
      <Logo className="mb-12" />
      <p className="type-overline uppercase tracking-[0.3em] text-faint">
        Error 404
      </p>
      <h1 className="type-h1 mt-4 text-center">
        Page Not Found
      </h1>
      <p className="mt-4 max-w-md text-center type-body leading-relaxed text-subtle">
        The page you are looking for does not exist or has moved. Use one of the
        links below to get back on track.
      </p>
      <nav
        aria-label="Not found links"
        className="mt-8 flex flex-wrap items-center justify-center gap-4 type-body"
      >
        <Link
          href="/"
          className="border border-line-strong px-5 py-2 text-text transition-colors hover:border-line-strong/50 hover:bg-surface-2"
        >
          Home
        </Link>
        <Link
          href="/about"
          className="border border-line-strong px-5 py-2 text-text transition-colors hover:border-line-strong/50 hover:bg-surface-2"
        >
          About
        </Link>
        <Link
          href="/intel"
          className="border border-line-strong px-5 py-2 text-text transition-colors hover:border-line-strong/50 hover:bg-surface-2"
        >
          Intel
        </Link>
      </nav>
    </main>
  );
}
