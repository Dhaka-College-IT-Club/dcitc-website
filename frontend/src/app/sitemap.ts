import type { MetadataRoute } from "next";
import { getAchievements, getIntels } from "@/lib/public-content";
import { SITE_URL } from "@/lib/site";

export const revalidate = 3600;

const STATIC_ROUTES: MetadataRoute.Sitemap = [
  { url: `${SITE_URL}/` },
  { url: `${SITE_URL}/about` },
  { url: `${SITE_URL}/departments` },
  { url: `${SITE_URL}/leadership` },
  { url: `${SITE_URL}/intel` },
  { url: `${SITE_URL}/privacy` },
  { url: `${SITE_URL}/terms` },
];

function parseDate(value?: string): Date | null {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [achievements, intels] = await Promise.all([
    getAchievements(),
    getIntels(),
  ]);

  const routes: MetadataRoute.Sitemap = [...STATIC_ROUTES];

  if (achievements && achievements.length > 0) {
    routes.push({ url: `${SITE_URL}/achievements` });
  }

  for (const intel of intels ?? []) {
    const lastModified = parseDate(intel.updatedAt ?? intel.createdAt);
    routes.push({
      url: `${SITE_URL}/intel/${intel.slug}`,
      ...(lastModified ? { lastModified } : {}),
    });
  }

  return routes;
}
