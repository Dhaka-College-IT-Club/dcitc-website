import { SITE_URL } from "./site";

export type BreadcrumbItem = { name: string; path: string };

/** Absolute URL for a site-relative path, used by JSON-LD nodes. */
export function absoluteUrl(path: string): string {
  return new URL(path, SITE_URL).toString();
}

/** ISO timestamp for a stored value, or undefined when it is not a real date. */
export function isoDate(value?: string | null): string | undefined {
  if (!value) return undefined;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? undefined : parsed.toISOString();
}

export function breadcrumbList(items: BreadcrumbItem[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  };
}
