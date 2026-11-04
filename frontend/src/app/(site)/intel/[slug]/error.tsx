"use client";

import Link from "next/link";
import Button from "@/components/ui/Button";

export default function IntelError({ retry }: { error: unknown; retry: () => void }) {
  return (
    <div className="flex min-h-[70vh] items-center justify-center bg-bg px-5 text-muted">
      <div className="w-full max-w-lg border border-line bg-white/[0.02] p-6">
        <p className="type-overline uppercase tracking-[0.28em] text-faint">
          Intel
        </p>
        <h1 className="type-h3 mt-2 font-bold text-text">
          This article could not be loaded
        </h1>
        <p className="mt-3 type-body leading-snug text-subtle">
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
        <p className="mt-4 type-caption text-faint">
          <Link href="/" className="text-text underline-offset-4 hover:underline">
            Return to the public site
          </Link>
          .
        </p>
      </div>
    </div>
  );
}
