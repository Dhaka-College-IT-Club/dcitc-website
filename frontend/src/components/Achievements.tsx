import Link from "next/link";
import AchievementCard from "./ui/AchievementCard";
import Reveal from "./ui/Reveal";
import { Container, Section } from "./ui/Section";
import SectionTitle from "./ui/SectionTitle";
import type { Achievement } from "@/lib/api-types";

const Achievements = ({ items = [] }: { items?: Achievement[] }) => {
  return (
    <Section id="achievements" seam>
      <Container>
        <Reveal>
          <SectionTitle
            eyebrow="Track record"
            title="Achievements"
            subtitle="Our milestones and victories"
          />

          {items.length === 0 ? (
            <p className="type-body-sm mt-10 text-center text-subtle">
              No achievements recorded yet. Check back soon!
            </p>
          ) : (
            <>
              <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {items.map((achievement) => (
                  <AchievementCard
                    key={achievement.id}
                    achievement={achievement}
                  />
                ))}
              </div>
              <div className="mt-10 text-center">
                <Link
                  href="/achievements"
                  className="type-body-sm inline-flex items-center gap-2 text-muted underline-offset-4 transition-colors hover:text-accent hover:underline"
                >
                  See all achievements
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

export default Achievements;
