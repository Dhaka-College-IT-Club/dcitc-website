/** Text helpers shared by the intel admin form, list cards and detail page. */

export function stripMarkdown(markdown: string): string {
  return markdown
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/~~~[\s\S]*?~~~/g, " ")
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/^\s{0,3}#{1,6}\s+/gm, "")
    .replace(/^\s{0,3}>\s?/gm, "")
    .replace(/^\s{0,3}(?:[-*+]|\d+\.)\s+/gm, "")
    .replace(/^\s{0,3}(?:[-*_]\s*){3,}$/gm, " ")
    .replace(/(\*\*|__)(.*?)\1/g, "$2")
    .replace(/(\*|_)(.*?)\1/g, "$2")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/<[^>]+>/g, " ")
    .replace(/\|/g, " ")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{2,}/g, "\n")
    .trim();
}

/** Plain first `max` characters, cut on a word boundary. */
export function autoExcerpt(content: string, max = 200): string {
  const text = stripMarkdown(content).replace(/\s+/g, " ").trim();
  if (text.length <= max) return text;
  const cut = text.slice(0, max);
  const lastSpace = cut.lastIndexOf(" ");
  return `${(lastSpace > max * 0.6 ? cut.slice(0, lastSpace) : cut).replace(/[.,;:!?-]+$/, "")}…`;
}

export function readingMinutes(content: string): number {
  const words = stripMarkdown(content).split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}

/** "31 October, 2026" (and most admin date labels) as "31 Oct 2026". */
export function formatShortDate(value: string): string {
  const text = value.trim();
  if (!text) return "";
  const parsed = new Date(text);
  if (Number.isNaN(parsed.getTime())) return text;
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(parsed);
}

export function headingId(text: string): string {
  return (
    text
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "") || "section"
  );
}

export type Heading = { id: string; text: string; level: 2 | 3 };

/** H2/H3 headings for the "On this page" list, skipping fenced code blocks. */
export function extractHeadings(content: string): Heading[] {
  const headings: Heading[] = [];
  let inFence = false;

  for (const line of content.split("\n")) {
    if (/^\s*(```|~~~)/.test(line)) {
      inFence = !inFence;
      continue;
    }
    if (inFence) continue;
    const match = /^(#{2,3})\s+(.+?)\s*#*\s*$/.exec(line);
    if (!match) continue;
    const text = match[2].replace(/[*_`]/g, "").trim();
    if (!text) continue;
    headings.push({
      id: headingId(text),
      text,
      level: match[1].length === 2 ? 2 : 3,
    });
  }
  return headings;
}

/**
 * The excerpt doubles as the standfirst, so skip it when it was derived from
 * the body (it would otherwise repeat as the article's first paragraph).
 */
export function shouldShowStandfirst(excerpt: string, content: string): boolean {
  const standfirst = excerpt.replace(/\s+/g, " ").trim().toLowerCase();
  if (!standfirst) return false;
  const body = stripMarkdown(content).replace(/\s+/g, " ").trim().toLowerCase();
  return !body.startsWith(standfirst.slice(0, 40));
}
