import Link from "next/link";
import IntelImage from "./IntelImage";
import { cleanTitle, formatShortDate } from "@/lib/intel";
import type { Intel } from "@/lib/api-types";

/** Shared intel card for the landing preview and the full /intel list. */
export default function IntelCard({ intel }: { intel: Intel }) {
  const title = cleanTitle(intel.title);

  return (
    <Link
      href={`/intel/${intel.slug}`}
      className="group flex h-full min-w-0 flex-col overflow-hidden border border-line bg-surface transition-colors duration-300 hover:border-line-strong hover:bg-surface"
    >
      <div className="relative aspect-video overflow-hidden">
        <IntelImage
          src={intel.image}
          alt={title}
          focalX={intel.imageFocalX}
          focalY={intel.imageFocalY}
          sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw"
          className="transition-transform duration-500 group-hover:scale-105"
        />
        {/* Fades the image into the card so the two read as one surface. */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-linear-to-t from-black via-black/60 to-transparent" />
        <span className="absolute bottom-3 left-4 inline-flex border border-line-strong bg-bg/60 px-2.5 py-1 font-orbitron text-3xs uppercase tracking-[0.2em] text-text backdrop-blur-sm">
          {intel.tag}
        </span>
      </div>

      <div className="flex grow flex-col px-5 pb-5 pt-4">
        <p className="font-rajdhani text-sm tracking-wide text-subtle">
          By {intel.author} · {formatShortDate(intel.date)}
        </p>
        <h3 className="mt-2 line-clamp-2 font-orbitron text-xl font-bold leading-snug text-text transition-colors group-hover:text-muted">
          {title}
        </h3>
        <p className="mt-2 line-clamp-2 font-rajdhani text-base leading-relaxed text-subtle">
          {intel.excerpt}
        </p>
        <span className="mt-4 inline-flex items-center gap-1.5 font-rajdhani text-sm font-semibold tracking-wide text-muted transition-colors group-hover:text-text">
          Read more
          <span className="sr-only">: {title}</span>
          <span
            aria-hidden="true"
            className="transition-transform duration-300 group-hover:translate-x-1"
          >
            →
          </span>
        </span>
      </div>
    </Link>
  );
}
