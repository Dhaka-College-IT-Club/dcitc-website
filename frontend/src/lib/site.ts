const FALLBACK_SITE_URL = "https://www.dcitc.org";

function resolveSiteUrl(): string {
  const raw = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (!raw) return FALLBACK_SITE_URL;
  try {
    return new URL(raw).origin;
  } catch {
    return FALLBACK_SITE_URL;
  }
}

/** Single absolute origin for canonicals, sitemap, robots and structured data. */
export const SITE_URL = resolveSiteUrl();

export const SITE_DESCRIPTION =
  "Dhaka College IT Club (DCITC) is a student technology club at Dhaka College in Dhaka, Bangladesh, exploring robotics, programming, cybersecurity, and AI.";
