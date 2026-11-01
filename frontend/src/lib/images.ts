/**
 * One resolver for every stored image value (admin table, cards, detail page).
 *
 * The database stores an absolute Supabase Storage public URL today, but older
 * rows can carry the loopback host they were uploaded from, and a bare storage
 * key is also accepted. Resolving in one place means those three surfaces can
 * never disagree about how to turn a column value into a URL.
 */

const STORAGE_PUBLIC_PATH = "/storage/v1/object/public/";

function storageOrigin(): string | null {
  const raw = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  if (!raw) return null;
  try {
    return new URL(raw).origin;
  } catch {
    return null;
  }
}

function uploadBucket(): string {
  return process.env.NEXT_PUBLIC_UPLOAD_BUCKET?.trim() || "uploads";
}

function isLoopback(hostname: string): boolean {
  return (
    hostname === "localhost" ||
    hostname === "127.0.0.1" ||
    hostname === "0.0.0.0" ||
    hostname === "::1" ||
    hostname === "[::1]"
  );
}

/** Absolute URL (or same-origin path) for an image column value. */
export function resolveImageUrl(src: string | null | undefined): string | null {
  const value = src?.trim();
  if (!value) return null;
  if (value.startsWith("/")) return value;

  const origin = storageOrigin();

  if (!/^https?:\/\//i.test(value)) {
    // A bare storage key, e.g. "2026/uuid-name.jpg".
    return origin
      ? `${origin}${STORAGE_PUBLIC_PATH}${uploadBucket()}/${value.replace(/^\/+/, "")}`
      : null;
  }

  try {
    const url = new URL(value);
    if (origin && isLoopback(url.hostname)) {
      // Uploaded locally, now served from the hosted project (or vice versa).
      return `${origin}${url.pathname}${url.search}`;
    }
    return url.toString();
  } catch {
    return null;
  }
}

/** Hosts that next/image is configured to optimize (mirrors next.config.ts). */
const optimizableHosts = new Set(
  (process.env.NEXT_PUBLIC_IMAGE_HOSTS ?? "")
    .split(",")
    .map((host) => host.trim().toLowerCase())
    .filter(Boolean),
);

/**
 * next/image throws when the optimizer does not allow a host, so unknown hosts
 * fall back to an unoptimized <img> instead of taking the page down.
 */
export function isOptimizableImage(src: string | null): boolean {
  if (!src) return false;
  if (src.startsWith("/")) return true;
  try {
    return optimizableHosts.has(new URL(src).hostname.toLowerCase());
  } catch {
    return false;
  }
}

/** `object-position` value for the stored focal point. */
export function focalPosition(x?: number | null, y?: number | null): string {
  const clamp = (value: number | null | undefined) =>
    Math.min(100, Math.max(0, Math.round(value ?? 50)));
  return `${clamp(x)}% ${clamp(y)}%`;
}
