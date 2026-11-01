"use client";

import Link from "next/link";
import Button from "@/components/ui/Button";

export default function IntelError({ retry }: { error: unknown; retry: () => void }) {
  return (
    <div className="flex min-h-[70vh] items-center justify-center bg-black px-5 text-slate-200">
      <div className="w-full max-w-lg border border-white/10 bg-white/[0.02] p-6">
        <p className="font-orbitron text-[10px] uppercase tracking-[0.28em] text-slate-500">
          Intel
        </p>
        <h1 className="mt-2 font-orbitron text-2xl font-bold text-white">
          This article could not be loaded
        </h1>
        <p className="mt-3 font-rajdhani text-base leading-snug text-slate-400">
          The content service did not respond. This is not a missing article —
          try again in a moment.
        </p>
        <div className="mt-6 flex flex-wrap gap-2">
          <Button type="button" onClick={() => retry()}>
            Try again
          </Button>
          <Button href="/intel" variant="secondary">
            Back to Intel
          </Button>
        </div>
        <p className="mt-4 font-rajdhani text-xs text-slate-500">
          <Link href="/" className="text-white underline-offset-4 hover:underline">
            Return to the public site
          </Link>
          .
        </p>
      </div>
    </div>
  );
}
