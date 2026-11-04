import Link from "next/link";
import IntelCard from "./ui/IntelCard";
import Reveal from "./ui/Reveal";
import { Container, Section } from "./ui/Section";
import SectionTitle from "./ui/SectionTitle";
import type { Intel } from "@/lib/api-types";

const BlogPreview = ({ items = [] }: { items?: Intel[] }) => {
  return (
    <Section id="intel">
      <Container>
        <Reveal>
          <SectionTitle
            eyebrow="Intel"
            title="Intel"
            subtitle="Latest insights from the DCITC"
          />

          {items.length === 0 ? (
            <p className="type-body-sm mt-10 text-center text-subtle">
              No intelligence reports available at this time.
            </p>
          ) : (
            <>
              <div className="mt-12 grid gap-6 md:grid-cols-3">
                {items.map((post) => (
                  <IntelCard key={post.id} intel={post} />
                ))}
              </div>

              <div className="mt-10 text-center">
                <Link
                  href="/intel"
                  className="type-body-sm inline-flex items-center gap-2 text-muted underline-offset-4 transition-colors hover:text-accent hover:underline"
                >
                  View all Intel
                  <span aria-hidden="true">→</span>
                </Link>
              </div>
            </>
          )}
        </Reveal>
      </Container>
    </Section>
  );
};

export default BlogPreview;
