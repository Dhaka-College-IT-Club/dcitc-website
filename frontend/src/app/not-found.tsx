import Link from "next/link";
import Logo from "@/components/ui/Logo";

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-black px-6 py-20 text-slate-200">
      <Logo className="mb-12" />
      <p className="font-orbitron text-[10px] uppercase tracking-[0.3em] text-slate-500">
        Error 404
      </p>
      <h1 className="mt-4 text-center font-orbitron text-4xl font-bold text-white md:text-5xl">
        Page Not Found
      </h1>
      <p className="mt-4 max-w-md text-center font-rajdhani text-lg leading-relaxed text-slate-400">
        The page you are looking for does not exist or has moved. Use one of the
        links below to get back on track.
      </p>
      <nav
        aria-label="Not found links"
        className="mt-8 flex flex-wrap items-center justify-center gap-4 font-rajdhani text-base"
      >
        <Link
          href="/"
          className="border border-white/20 px-5 py-2 text-white transition-colors hover:border-white/50 hover:bg-white/10"
        >
          Home
        </Link>
        <Link
          href="/about"
          className="border border-white/20 px-5 py-2 text-white transition-colors hover:border-white/50 hover:bg-white/10"
        >
          About
        </Link>
        <Link
          href="/intel"
          className="border border-white/20 px-5 py-2 text-white transition-colors hover:border-white/50 hover:bg-white/10"
        >
          Intel
        </Link>
      </nav>
    </main>
  );
}
