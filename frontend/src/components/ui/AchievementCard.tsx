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
    <article className="flex h-full flex-col overflow-hidden border border-line bg-surface">
      <div className="relative aspect-video overflow-hidden">
        <IntelImage
          src={achievement.image}
          alt={achievement.title}
          focalX={achievement.imageFocalX}
          focalY={achievement.imageFocalY}
          sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-linear-to-t from-surface via-surface/60 to-transparent"
        />
        <span className="type-overline absolute bottom-3 left-4 inline-flex items-center border border-line-strong bg-surface/90 px-2.5 py-1 text-accent backdrop-blur-sm">
          {achievement.year}
        </span>
      </div>

      <div className="flex grow flex-col p-5">
        <h3 className="type-h3 line-clamp-2">{achievement.title}</h3>
        <p className="type-body-sm mt-2 line-clamp-3 text-subtle">
          {achievement.detail}
        </p>
      </div>
    </article>
  );
}
