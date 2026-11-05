"use client";

import { useEffect, useState } from "react";
import type { Heading } from "@/lib/intel";

/**
 * Sticky table of contents built from the article's h2/h3 headings. The
 * current section is marked with aria-current — the marker reads headings
 * that are already on the page, it does not invent a scroll indicator.
 */
export default function TableOfContents({ headings }: { headings: Heading[] }) {
  const [activeId, setActiveId] = useState<string>("");

  useEffect(() => {
    const targets = headings
      .map((heading) => document.getElementById(heading.id))
      .filter((element): element is HTMLElement => element !== null);

    if (targets.length === 0) return;

    let frame = 0;

    // The active section is the last heading that has crossed the reading line.
    const update = () => {
      frame = 0;
      const line = window.innerHeight * 0.3;
      let current = "";
      for (const target of targets) {
        if (target.getBoundingClientRect().top <= line) current = target.id;
      }
      setActiveId(current);
    };

    const onScroll = () => {
      if (frame === 0) frame = window.requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (frame !== 0) window.cancelAnimationFrame(frame);
    };
  }, [headings]);

  if (headings.length < 2) return null;

  return (
    <aside aria-label="On this page" className="sticky top-28">
      <p className="readout">On this page</p>
      <nav className="mt-3 border-l border-line">
        <ul className="space-y-2">
          {headings.map((heading) => {
            const active = heading.id === activeId;
            return (
              <li key={`${heading.id}-${heading.text}`}>
                <a
                  href={`#${heading.id}`}
                  aria-current={active ? "true" : undefined}
                  className={`block border-l-2 py-0.5 text-sm leading-snug transition-colors ${
                    active
                      ? "border-accent-line text-text"
                      : "border-transparent text-subtle hover:text-text"
                  } ${heading.level === 3 ? "pl-6" : "pl-4"}`}
                >
                  {heading.text}
                </a>
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
}
