"use client";

import { type ReactNode } from "react";
import Markdown, { type Components } from "react-markdown";
import rehypeSanitize from "rehype-sanitize";
import remarkGfm from "remark-gfm";
import { headingId } from "@/lib/intel";
import styles from "./IntelMarkdown.module.css";

function nodeText(node: ReactNode): string {
  if (node === null || node === undefined || typeof node === "boolean") return "";
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(nodeText).join("");
  if (typeof node === "object" && "props" in node) {
    return nodeText((node.props as { children?: ReactNode }).children);
  }
  return "";
}

function AnchoredHeading({
  level,
  children,
}: {
  level: 2 | 3 | 4;
  children?: ReactNode;
}) {
  const text = nodeText(children);
  const Tag = `h${level}` as "h2" | "h3" | "h4";
  // Markdown "#" renders as an h2: the article title owns the only h1.
  return <Tag id={headingId(text)}>{children}</Tag>;
}

const components: Components = {
  h1: ({ children }) => <AnchoredHeading level={2}>{children}</AnchoredHeading>,
  h2: ({ children }) => <AnchoredHeading level={2}>{children}</AnchoredHeading>,
  h3: ({ children }) => <AnchoredHeading level={3}>{children}</AnchoredHeading>,
  h4: ({ children }) => <AnchoredHeading level={4}>{children}</AnchoredHeading>,
  a: ({ href, children }) => {
    const external = Boolean(href && /^https?:\/\//i.test(href));
    return (
      <a
        href={href}
        {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
      >
        {children}
      </a>
    );
  },
  table: ({ children }) => (
    <div className={styles.tableWrap}>
      <table>{children}</table>
    </div>
  ),
};

/** Renders admin-authored markdown as sanitized, styled article content. */
export default function IntelMarkdown({
  content,
  className = "",
}: {
  content: string;
  className?: string;
}) {
  return (
    <div className={`${styles.article} ${className}`.trim()}>
      <Markdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeSanitize]}
        components={components}
      >
        {content}
      </Markdown>
    </div>
  );
}
