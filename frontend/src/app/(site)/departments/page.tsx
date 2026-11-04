import type { Metadata } from "next";
import Link from "next/link";
import Breadcrumbs from "@/components/seo/Breadcrumbs";
import { DEPARTMENTS } from "@/constants";
import { DEFAULT_OG_IMAGE } from "@/lib/site";

const DESCRIPTION =
  "Dhaka College IT Club (DCITC) departments: Web Development, Graphics & Design, Content Writing & Publication, Cyber Security, Robotics & Programming, and Competitive Programming.";

export const metadata: Metadata = {
  title: "Departments",
  description: DESCRIPTION,
  alternates: { canonical: "/departments" },
  openGraph: {
    siteName: "Dhaka College IT Club",
    type: "website",
    locale: "en_US",
    url: "/departments",
    title: "Departments | Dhaka College IT Club",
    description: DESCRIPTION,
    images: [DEFAULT_OG_IMAGE],
  },
};

export default function DepartmentsPage() {
  return (
    <div className="min-h-screen bg-bg pb-16 pt-28 text-muted md:pb-24">
      <div className="mx-auto w-full max-w-[1200px] px-6">
        <Breadcrumbs
          items={[
            { name: "Home", path: "/" },
            { name: "Departments", path: "/departments" },
          ]}
        />

        <header className="mb-12">
          <p className="mb-3 type-overline uppercase tracking-[0.3em] text-faint">
            Specialized teams
          </p>
          <h1 className="type-h1 mb-4">
            Departments
          </h1>
          <p className="max-w-2xl type-body leading-relaxed text-subtle">
            The six teams where Dhaka College IT Club (DCITC) members build,
            design, write, secure, and compete.
          </p>
        </header>

        <div className="grid gap-6 md:grid-cols-2">
          {DEPARTMENTS.map((department) => (
            <section
              key={department.title}
              className="border border-line bg-surface p-6"
            >
              <h2 className="mb-3 type-h3 font-bold text-text">
                {department.title}
              </h2>
              <p className="type-body leading-relaxed text-subtle">
                {department.description}
              </p>
            </section>
          ))}
        </div>

        <p className="mt-10 type-body text-subtle">
          Ready to pick a team?{" "}
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
            read more about the club
          </Link>
          .
        </p>
      </div>
    </div>
  );
}
