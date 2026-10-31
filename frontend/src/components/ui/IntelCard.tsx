import Link from "next/link";
import IntelImage from "./IntelImage";
import { formatShortDate } from "@/lib/intel";
import type { Intel } from "@/lib/api-types";

/** Shared intel card for the landing preview and the full /intel list. */
export default function IntelCard({ intel }: { intel: Intel }) {
  return (
    <Link
      href={`/intel/${intel.slug}`}
      className="group flex h-full min-w-0 flex-col overflow-hidden border border-white/10 bg-white/[0.015] transition-colors duration-300 hover:border-white/30 hover:bg-white/[0.03]"
    >
      <div className="relative aspect-video overflow-hidden">
        <IntelImage
          src={intel.image}
          alt={intel.title}
          focalX={intel.imageFocalX}
          focalY={intel.imageFocalY}
          sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw"
          className="transition-transform duration-500 group-hover:scale-105"
        />
        {/* Fades the image into the card so the two read as one surface. */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-linear-to-t from-black via-black/60 to-transparent" />
        <span className="absolute bottom-3 left-4 inline-flex border border-white/20 bg-black/60 px-2.5 py-1 font-orbitron text-[10px] uppercase tracking-[0.2em] text-white backdrop-blur-sm">
          {intel.tag}
        </span>
      </div>

      <div className="flex grow flex-col px-5 pb-5 pt-4">
        <p className="font-rajdhani text-[13px] tracking-wide text-slate-400">
          By {intel.author} · {formatShortDate(intel.date)}
        </p>
        <h3 className="mt-2 line-clamp-2 font-orbitron text-xl font-bold leading-snug text-white transition-colors group-hover:text-slate-200">
          {intel.title}
        </h3>
        <p className="mt-2 line-clamp-2 font-rajdhani text-[15px] leading-relaxed text-slate-400">
          {intel.excerpt}
        </p>
        <span className="mt-4 inline-flex items-center gap-1.5 font-rajdhani text-sm font-semibold tracking-wide text-slate-300 transition-colors group-hover:text-white">
          Read more
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
