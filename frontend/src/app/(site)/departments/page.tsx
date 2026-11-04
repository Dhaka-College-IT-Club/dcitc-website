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
    <div className="min-h-screen bg-bg pb-24 pt-32 text-muted">
      <div className="mx-auto max-w-5xl px-6">
        <Breadcrumbs
          items={[
            { name: "Home", path: "/" },
            { name: "Departments", path: "/departments" },
          ]}
        />

        <header className="mb-12">
          <p className="mb-3 font-orbitron text-xs uppercase tracking-[0.3em] text-faint">
            Specialized teams
          </p>
          <h1 className="mb-4 font-orbitron text-4xl font-bold leading-tight text-text md:text-5xl">
            Departments
          </h1>
          <p className="max-w-2xl font-rajdhani text-lg leading-relaxed text-subtle">
            The six teams where Dhaka College IT Club (DCITC) members build,
            design, write, secure, and compete.
          </p>
        </header>

        <div className="grid gap-6 md:grid-cols-2">
          {DEPARTMENTS.map((department) => (
            <section
              key={department.title}
              className="border border-line bg-white/[0.02] p-6"
            >
              <h2 className="mb-3 font-orbitron text-xl font-bold text-text">
                {department.title}
              </h2>
              <p className="font-rajdhani text-lg leading-relaxed text-subtle">
                {department.description}
              </p>
            </section>
          ))}
        </div>

        <p className="mt-10 font-rajdhani text-lg text-subtle">
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
