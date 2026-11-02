import { cache } from "react";
import type { Achievement, Intel, Leader } from "./api-types";

const TIMEOUT_MS = 5_000;

/**
 * Server-only read of the public API. Returns null on any failure so metadata,
 * the sitemap and content pages degrade instead of throwing.
 */
async function readPublic<T>(path: string): Promise<T | null> {
  const origin = process.env.API_ORIGIN;
  if (!origin) return null;
  try {
    const res = await fetch(`${origin}/api/v2${path}`, {
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (!res.ok) return null;
    const json = (await res.json()) as { data?: T } | T | null;
    return ((json as { data?: T } | null)?.data ?? (json as T)) ?? null;
  } catch {
    return null;
  }
}

export const getAchievements = cache(async (): Promise<Achievement[] | null> =>
  readPublic<Achievement[]>("/achievements"),
);

export const getIntels = cache(async (): Promise<Intel[] | null> =>
  readPublic<Intel[]>("/intels"),
);

export const getIntelBySlug = cache(async (slug: string): Promise<Intel | null> =>
  readPublic<Intel>(`/intels/${encodeURIComponent(slug)}`),
);

export const getLeadership = cache(async (): Promise<Leader[] | null> =>
  readPublic<Leader[]>("/leadership"),
);
