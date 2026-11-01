import type { Heading } from "@/lib/intel";

/** Sticky table of contents built from the article's h2/h3 headings. */
export default function TableOfContents({ headings }: { headings: Heading[] }) {
  if (headings.length < 2) return null;

  return (
    <aside aria-label="On this page" className="sticky top-28">
      <p className="font-orbitron text-[10px] uppercase tracking-[0.24em] text-slate-500">
        On this page
      </p>
      <nav className="mt-3 border-l border-white/10">
        <ul className="space-y-2">
          {headings.map((heading) => (
            <li key={`${heading.id}-${heading.text}`}>
              <a
                href={`#${heading.id}`}
                className={`block border-l-2 border-transparent py-0.5 text-sm leading-snug text-slate-400 transition-colors hover:border-[#66fcf1] hover:text-white ${
                  heading.level === 3 ? "pl-6" : "pl-4"
                }`}
              >
                {heading.text}
              </a>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
}
