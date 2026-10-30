import Image from "next/image";
import Link from "next/link";
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
              <Link
                key={item.id}
                href={`/achievements/${item.id}`}
                className="group bg-dc-panel border border-white/10 p-6 flex flex-col gap-3 hover:border-white/40 hover:-translate-y-2 transition-all duration-300"
              >
                <div className="relative w-full h-40 mb-2 overflow-hidden border border-white/10 bg-black/40">
                  {item.image ? (
                    <Image
                      src={item.image}
                      alt={item.title}
                      fill
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  ) : null}
                </div>
                <span className="text-xs font-orbitron tracking-[0.3em] text-slate-500 uppercase">
                  {item.year}
                </span>
                <h2 className="text-lg md:text-xl font-orbitron text-white group-hover:text-slate-200">
                  {item.title}
                </h2>
                <p className="font-rajdhani text-slate-400 text-sm leading-relaxed line-clamp-3">
                  {item.detail}
                </p>
                <div className="mt-auto pt-4 border-t border-white/5 flex justify-end">
                  <span className="text-sm font-orbitron text-white/80 border-b border-transparent group-hover:border-white/50 transition-colors">
                    Mission Briefing →
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}