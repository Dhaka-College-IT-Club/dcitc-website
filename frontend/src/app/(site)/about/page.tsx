import type { Metadata } from "next";
import Link from "next/link";
import Breadcrumbs from "@/components/seo/Breadcrumbs";
import { CLUB, DEPARTMENTS, LEGAL } from "@/constants";
import { DEFAULT_OG_IMAGE } from "@/lib/site";

const DESCRIPTION =
  "Dhaka College IT Club (DCITC) is a student technology club at Dhaka College in Dhaka, Bangladesh. Learn who we are, our mission, and what members do.";

export const metadata: Metadata = {
  title: "About",
  description: DESCRIPTION,
  alternates: { canonical: "/about" },
  openGraph: {
    siteName: "Dhaka College IT Club",
    type: "website",
    locale: "en_US",
    url: "/about",
    title: "About | Dhaka College IT Club",
    description: DESCRIPTION,
    images: [DEFAULT_OG_IMAGE],
  },
};

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-bg pb-24 pt-32 text-muted">
      <div className="mx-auto max-w-[768px] px-6">
        <Breadcrumbs
          items={[
            { name: "Home", path: "/" },
            { name: "About", path: "/about" },
          ]}
        />

        <header className="mb-12">
          <p className="mb-3 font-orbitron text-xs uppercase tracking-[0.3em] text-faint">
            About the club
          </p>
          <h1 className="mb-4 font-orbitron text-4xl font-bold leading-tight text-text md:text-5xl">
            About Dhaka College IT Club (DCITC)
          </h1>
          <p className="font-rajdhani text-lg leading-relaxed text-subtle">
            A student technology club at Dhaka College in Dhaka, Bangladesh,
            building practical skills across six departments.
          </p>
        </header>

        <div className="space-y-10 font-rajdhani text-lg leading-relaxed text-muted">
          <section>
            <h2 className="mb-3 font-orbitron text-xl font-bold text-text">
              Who we are
            </h2>
            <p>
              Dhaka College IT Club (DCITC) is a student technology club at
              Dhaka College in Dhaka, Bangladesh. This website is the club&apos;s
              public home and the place where members manage their accounts.
            </p>
            <p className="mt-4">
              Also known as the Dhaka College Information Technology Club, the
              club&apos;s mission is clear: {CLUB.MISSION.STATEMENT}
            </p>
          </section>

          <section>
            <h2 className="mb-3 font-orbitron text-xl font-bold text-text">
              Who it is for
            </h2>
            <p>
              The public pages are open to everyone. Accounts are intended for
              DCITC members and Dhaka College students, which is why sign-up asks
              for your HSC batch. Many DCITC members are HSC students and may be
              under 18.
            </p>
          </section>

          <section>
            <h2 className="mb-3 font-orbitron text-xl font-bold text-text">
              What members do
            </h2>
            <p>
              Members work across six departments:{" "}
              {DEPARTMENTS.map((department) => department.title).join(", ")}.
              They build projects, take part in competitions, and learn from
              seniors and industry guests through regular sessions.
            </p>
            <p className="mt-4">
              <Link
                href="/departments"
                className="text-text underline-offset-4 hover:underline"
              >
                Explore the departments
              </Link>{" "}
              to see what each team does.
            </p>
          </section>

          <section>
            <h2 className="mb-3 font-orbitron text-xl font-bold text-text">
              Get involved
            </h2>
            <p>
              <Link
                href="/signup"
                className="text-text underline-offset-4 hover:underline"
              >
                Join DCITC
              </Link>{" "}
              to create an account, or{" "}
              <Link
                href="/leadership"
                className="text-text underline-offset-4 hover:underline"
              >
                meet the leadership
              </Link>{" "}
              serving every batch.
            </p>
            <p className="mt-4">
              Questions about the club go to{" "}
              <a
                href={`mailto:${LEGAL.CONTACT_EMAIL}`}
                className="text-text underline-offset-4 hover:underline"
              >
                {LEGAL.CONTACT_EMAIL}
              </a>
              .
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
