import Link from "next/link";
import AchievementCard from "./ui/AchievementCard";
import SectionTitle from "./ui/SectionTitle";
import type { Achievement } from "@/lib/api-types";

const Achievements = ({ items = [] }: { items?: Achievement[] }) => {
  return (
    <section id="achievements" className="py-24 bg-black relative">
      <div className="max-w-7xl mx-auto px-6">
        <SectionTitle
          title="Achievements"
          subtitle="Our Milestones and Victories"
        />

        {items.length === 0 ? (
          <div className="text-center py-10">
            <p className="text-slate-500 font-rajdhani text-lg">
              No achievements recorded yet. Check back soon!
            </p>
          </div>
        ) : (
          <>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {items.map((achievement) => (
                <AchievementCard key={achievement.id} achievement={achievement} />
              ))}
            </div>
            <div className="text-center mt-16">
              <Link
                href="/achievements"
                className="font-rajdhani text-sm font-semibold tracking-wide text-slate-300 border-b border-white/30 pb-0.5 transition-colors hover:text-white hover:border-white"
              >
                See all →
              </Link>
            </div>
          </>
        )}
      </div>
    </section>
  );
};

export default Achievements;
