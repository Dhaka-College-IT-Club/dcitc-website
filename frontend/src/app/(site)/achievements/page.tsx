import type { Metadata } from "next";
import AchievementCard from "@/components/ui/AchievementCard";
import { getAchievements } from "@/lib/public-content";

export const revalidate = 60;

const DESCRIPTION =
  "Dhaka College IT Club (DCITC) achievements: milestones, competition results, and project highlights from our student members across Dhaka College.";

export async function generateMetadata(): Promise<Metadata> {
  const achievements = await getAchievements();
  const empty = achievements !== null && achievements.length === 0;

  return {
    title: "Achievements",
    description: DESCRIPTION,
    alternates: { canonical: "/achievements" },
    openGraph: {
      siteName: "Dhaka College IT Club",
      type: "website",
      locale: "en_US",
      url: "/achievements",
      title: "Achievements | Dhaka College IT Club",
      description: DESCRIPTION,
    },
    ...(empty ? { robots: { index: false, follow: true } } : {}),
  };
}

export default async function AchievementsPage() {
  const achievements = await getAchievements();
  const items = achievements ?? [];

  return (
    <div className="min-h-screen bg-black text-slate-200 pt-32 pb-16">
      <div className="max-w-6xl mx-auto px-6">
        <header className="mb-10">
          <p className="text-xs font-orbitron tracking-[0.3em] text-slate-500 uppercase mb-3">
            Mission Log
          </p>
          <h1 className="text-4xl md:text-5xl font-orbitron font-bold text-white mb-4">
            Achievements
          </h1>
          <p className="text-slate-400 font-rajdhani text-lg">
            Celebrating our milestones and competitive victories
          </p>
        </header>

        {items.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-slate-500 font-rajdhani text-xl">
              No achievements recorded yet. Check back soon!
            </p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {items.map((item) => (
              <AchievementCard key={item.id} achievement={item} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
