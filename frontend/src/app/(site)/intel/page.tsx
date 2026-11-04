import Link from "next/link";
import type { Metadata } from "next";
import { apiServer } from "@/lib/api";
import { DEFAULT_OG_IMAGE } from "@/lib/site";
import { breadcrumbList } from "@/lib/structured-data";
import JsonLd from "@/components/seo/JsonLd";
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
    images: [DEFAULT_OG_IMAGE],
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

  const breadcrumbs = breadcrumbList([
    { name: "Home", path: "/" },
    { name: "Intel", path: "/intel" },
  ]);

  return (
    <div className="min-h-screen bg-bg text-muted pt-32 pb-16">
      <JsonLd data={breadcrumbs} />
      <div className="mx-auto w-full max-w-[1200px] px-6">
        <header className="mb-10">
          <p className="type-overline tracking-[0.3em] text-faint uppercase mb-3">
            Intelligence Briefing
          </p>
          <h1 className="type-h1 mb-4">
            Intel
          </h1>
          <p className="text-subtle type-body">
            Articles, insights, and updates from the Dhaka College IT Club
            (DCITC) team
          </p>
        </header>

        {failed ? (
          <div className="border border-line bg-white/[0.02] px-6 py-16 text-center">
            <p className="type-overline uppercase tracking-[0.24em] text-faint">
              Content unavailable
            </p>
            <p className="mt-3 type-body text-subtle">
              We couldn&apos;t load Intel right now. This is not an empty
              archive — check again in a moment.
            </p>
            <Link
              href="/intel"
              className="mt-5 inline-block type-overline uppercase tracking-[0.2em] text-text underline-offset-4 hover:underline"
            >
              Try again
            </Link>
          </div>
        ) : intels.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-faint type-subhead">
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
