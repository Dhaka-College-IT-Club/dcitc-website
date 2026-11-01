import AchievementCard from "@/components/ui/AchievementCard";
import { apiServer } from "@/lib/api";
import type { Achievement } from "@/lib/api-types";

export const revalidate = 60;

export default async function AchievementsPage() {
  let achievements: Achievement[] = [];
  try {
    achievements = await apiServer<Achievement[]>("/achievements");
  } catch {
    achievements = [];
  }

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

        {achievements.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-slate-500 font-rajdhani text-xl">
              No achievements recorded yet. Check back soon!
            </p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {achievements.map((item) => (
              <AchievementCard key={item.id} achievement={item} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
