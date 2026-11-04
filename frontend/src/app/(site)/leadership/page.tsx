import type { Metadata } from "next";
import Link from "next/link";
import Breadcrumbs from "@/components/seo/Breadcrumbs";
import JsonLd from "@/components/seo/JsonLd";
import { LEADERSHIP } from "@/constants";
import { getLeadership } from "@/lib/public-content";
import { DEFAULT_OG_IMAGE } from "@/lib/site";
import type { Leader } from "@/lib/api-types";

const DESCRIPTION =
  "Dhaka College IT Club (DCITC) leadership: meet the executive board, chief executives, and joint executives serving every batch at Dhaka College.";

export const metadata: Metadata = {
  title: "Leadership",
  description: DESCRIPTION,
  alternates: { canonical: "/leadership" },
  openGraph: {
    siteName: "Dhaka College IT Club",
    type: "website",
    locale: "en_US",
    url: "/leadership",
    title: "Leadership | Dhaka College IT Club",
    description: DESCRIPTION,
    images: [DEFAULT_OG_IMAGE],
  },
};

const FALLBACK_MEMBERS: Leader[] = LEADERSHIP.MEMBERS.map((member, index) => ({
  id: index,
  name: member.name,
  role: member.role,
  tier: member.tier as Leader["tier"],
  batch: member.batch,
  image: member.image,
  facebook: member.facebook === "#" ? null : member.facebook,
  linkedin: member.linkedin === "#" ? null : member.linkedin,
  github: null,
  portfolio: null,
  sortOrder: index,
}));

export default async function LeadershipPage() {
  const members = (await getLeadership()) ?? FALLBACK_MEMBERS;
  const batches = Array.from(new Set(members.map((member) => member.batch))).sort().reverse();

  const peopleJsonLd = {
    "@context": "https://schema.org",
    "@graph": members.map((member) => ({
      "@type": "Person",
      name: member.name,
      jobTitle: member.role,
      worksFor: {
        "@type": "EducationalOrganization",
        name: "Dhaka College IT Club",
      },
    })),
  };

  return (
    <div className="min-h-screen bg-bg pb-24 pt-32 text-muted">
      <JsonLd data={peopleJsonLd} />
      <div className="mx-auto max-w-5xl px-6">
        <Breadcrumbs
          items={[
            { name: "Home", path: "/" },
            { name: "Leadership", path: "/leadership" },
          ]}
        />

        <header className="mb-12">
          <p className="mb-3 font-orbitron text-xs uppercase tracking-[0.3em] text-faint">
            The panel
          </p>
          <h1 className="mb-4 font-orbitron text-4xl font-bold leading-tight text-text md:text-5xl">
            Leadership
          </h1>
          <p className="max-w-2xl font-rajdhani text-lg leading-relaxed text-subtle">
            The commanding officers steering Dhaka College IT Club (DCITC)
            towards innovation.
          </p>
        </header>

        {batches.length === 0 ? (
          <p className="font-rajdhani text-xl text-faint">
            Panel coming soon
          </p>
        ) : (
          <div className="space-y-12">
            {batches.map((batch) => (
              <section key={batch}>
                <h2 className="mb-5 border-b border-line pb-3 font-orbitron text-sm uppercase tracking-[0.28em] text-faint">
                  {batch}
                </h2>
                <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                  {members
                    .filter((member) => member.batch === batch)
                    .map((member) => (
                      <li
                        key={`${member.batch}-${member.name}`}
                        className="border border-line bg-white/[0.02] p-5"
                      >
                        <h3 className="font-orbitron text-base font-bold tracking-wider text-text">
                          {member.name}
                        </h3>
                        <p className="mt-2 font-rajdhani text-base text-subtle">
                          {member.role}
                        </p>
                      </li>
                    ))}
                </ul>
              </section>
            ))}
          </div>
        )}

        <p className="mt-12 font-rajdhani text-lg text-subtle">
          Want to be on this list?{" "}
          <Link
            href="/signup"
            className="text-text underline-offset-4 hover:underline"
          >
            Join DCITC
          </Link>{" "}
          or{" "}
          <Link
            href="/about"
            className="text-text underline-offset-4 hover:underline"
          >
            learn about the club
          </Link>
          .
        </p>
      </div>
    </div>
  );
}
