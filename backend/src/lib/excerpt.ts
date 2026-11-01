/**
 * Markdown-to-plain-text helpers used to derive an intel excerpt from its body.
 * Kept dependency-free: the frontend has its own copy in lib/markdown.ts.
 */
export function stripMarkdown(markdown: string): string {
  return markdown
    // Fenced code blocks and their contents.
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/~~~[\s\S]*?~~~/g, " ")
    // Images keep their alt text; links keep their label.
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    // Headings, blockquotes, list markers, rules.
    .replace(/^\s{0,3}#{1,6}\s+/gm, "")
    .replace(/^\s{0,3}>\s?/gm, "")
    .replace(/^\s{0,3}(?:[-*+]|\d+\.)\s+/gm, "")
    .replace(/^\s{0,3}(?:[-*_]\s*){3,}$/gm, " ")
    // Emphasis and inline code markers.
    .replace(/(\*\*|__)(.*?)\1/g, "$2")
    .replace(/(\*|_)(.*?)\1/g, "$2")
    .replace(/`([^`]+)`/g, "$1")
    // Raw HTML and leftover table pipes.
    .replace(/<[^>]+>/g, " ")
    .replace(/\|/g, " ")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{2,}/g, "\n")
    .trim();
}

/** First `max` characters of the plain body, cut on a word boundary. */
export function autoExcerpt(content: string, max = 200): string {
  const text = stripMarkdown(content).replace(/\s+/g, " ").trim();
  if (text.length <= max) return text;
  const cut = text.slice(0, max);
  const lastSpace = cut.lastIndexOf(" ");
  return `${(lastSpace > max * 0.6 ? cut.slice(0, lastSpace) : cut).replace(/[.,;:!?-]+$/, "")}…`;
}
