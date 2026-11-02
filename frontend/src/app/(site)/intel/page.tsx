import Link from "next/link";
import type { Metadata } from "next";
import { apiServer } from "@/lib/api";
import IntelCard from "@/components/ui/IntelCard";
import type { Intel } from "@/lib/api-types";

export const revalidate = 60;

const DESCRIPTION =
  "Dhaka College IT Club (DCITC) Intel: articles, insights, and updates written by our members on technology, programming, cybersecurity, and robotics.";

export const metadata: Metadata = {
  title: "Intel",
  description: DESCRIPTION,
  alternates: { canonical: "/intel" },
  openGraph: {
    siteName: "Dhaka College IT Club",
    type: "website",
    locale: "en_US",
    url: "/intel",
    title: "Intel | Dhaka College IT Club",
    description: DESCRIPTION,
  },
};

export default async function IntelsPage() {
  let intels: Intel[] = [];
  let failed = false;
  try {
    intels = await apiServer<Intel[]>("/intels");
  } catch {
    failed = true;
  }

  return (
    <div className="min-h-screen bg-black text-slate-200 pt-32 pb-16">
      <div className="max-w-6xl mx-auto px-6">
        <header className="mb-10">
          <p className="text-xs font-orbitron tracking-[0.3em] text-slate-500 uppercase mb-3">
            Intelligence Briefing
          </p>
          <h1 className="text-4xl md:text-5xl font-orbitron font-bold text-white mb-4">
            Intel
          </h1>
          <p className="text-slate-400 font-rajdhani text-lg">
            Latest insights and updates from the DCITC team
          </p>
        </header>

        {failed ? (
          <div className="border border-white/10 bg-white/[0.02] px-6 py-16 text-center">
            <p className="font-orbitron text-xs uppercase tracking-[0.24em] text-slate-500">
              Content unavailable
            </p>
            <p className="mt-3 font-rajdhani text-lg text-slate-400">
              We couldn&apos;t load Intel right now. This is not an empty
              archive — check again in a moment.
            </p>
            <Link
              href="/intel"
              className="mt-5 inline-block font-orbitron text-[10px] uppercase tracking-[0.2em] text-white underline-offset-4 hover:underline"
            >
              Try again
            </Link>
          </div>
        ) : intels.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-slate-500 font-rajdhani text-xl">
              No intelligence reports available at this time.
            </p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {intels.map((intel) => (
              <IntelCard key={intel.id} intel={intel} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
