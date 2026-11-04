import IntelImage from "./IntelImage";
import type { Achievement } from "@/lib/api-types";

/**
 * Static achievement card. Achievements have no detail page, so this is
 * deliberately not a link and shows no interactive hover state.
 */
export default function AchievementCard({
  achievement,
}: {
  achievement: Achievement;
}) {
  return (
    <div className="flex h-full flex-col overflow-hidden border border-line bg-surface">
      <div className="relative aspect-video overflow-hidden">
        <IntelImage
          src={achievement.image}
          alt={achievement.title}
          focalX={achievement.imageFocalX}
          focalY={achievement.imageFocalY}
          sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw"
        />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-linear-to-t from-black via-black/60 to-transparent" />
        <span className="absolute bottom-3 left-4 inline-flex border border-line-strong bg-bg/60 px-2.5 py-1 font-orbitron text-3xs uppercase tracking-[0.2em] text-text backdrop-blur-sm">
          {achievement.year}
        </span>
      </div>

      <div className="flex grow flex-col px-5 pb-5 pt-4">
        <h3 className="font-orbitron text-lg font-bold leading-tight text-text">
          {achievement.title}
        </h3>
        <p className="mt-2 line-clamp-3 font-rajdhani text-sm leading-relaxed text-subtle">
          {achievement.detail}
        </p>
      </div>
    </div>
  );
}
