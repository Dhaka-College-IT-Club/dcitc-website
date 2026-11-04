import Link from "next/link";
import { Badge } from "./Eyebrow";
import IntelImage from "./IntelImage";
import { cleanTitle, formatShortDate } from "@/lib/intel";
import type { Intel } from "@/lib/api-types";

/** Shared intel card for the landing preview and the full /intel list. */
export default function IntelCard({ intel }: { intel: Intel }) {
  const title = cleanTitle(intel.title);

  return (
    <Link
      href={`/intel/${intel.slug}`}
      className="group flex h-full min-w-0 flex-col overflow-hidden border border-line bg-surface transition-colors duration-200 hover:border-line-strong hover:bg-surface-2"
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
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-linear-to-t from-surface via-surface/60 to-transparent"
        />
        <Badge className="absolute bottom-3 left-4 bg-surface/90 backdrop-blur-sm">
          {intel.tag}
        </Badge>
      </div>

      <div className="flex grow flex-col p-5">
        <p className="type-caption text-faint">
          By {intel.author} · {formatShortDate(intel.date)}
        </p>
        <h3 className="type-h3 mt-2 line-clamp-2 transition-colors group-hover:text-accent">
          {title}
        </h3>
        <p className="type-body-sm mt-2 line-clamp-2 text-subtle">
          {intel.excerpt}
        </p>
        <span className="type-body-sm mt-4 inline-flex items-center gap-1.5 text-muted transition-colors group-hover:text-accent">
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
