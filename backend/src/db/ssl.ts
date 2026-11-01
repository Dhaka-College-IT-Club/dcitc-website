import { URL } from "node:url";

export type SslConfig = false | { rejectUnauthorized: boolean; ca?: string };

/** Where the database actually lives, independent of the connection string's shape. */
export function isLocalDatabase(connectionString: string): boolean {
  try {
    const host = new URL(connectionString).hostname.replace(/^\[|\]$/g, "");
    return host === "localhost" || host === "127.0.0.1" || host === "::1";
  } catch {
    return /(^|@|\/\/)localhost[:\/]|(^|@|\/\/)127\.0\.0\.1[:\/]|\[::1\][:\/]/.test(connectionString);
  }
}

/**
 * TLS for the pg pool. Local Supabase serves a self-signed certificate, so local
 * connections skip TLS. Everything else in production verifies the provider's
 * certificate — a missing CA keeps `rejectUnauthorized: true` (fail closed) rather
 * than silently accepting any certificate.
 */
export function sslConfig(connectionString: string, nodeEnv: string, ca?: string): SslConfig {
  if (nodeEnv !== "production" || isLocalDatabase(connectionString)) return false;
  return ca
    ? { rejectUnauthorized: true, ca: ca.replace(/\\n/g, "\n") }
    : { rejectUnauthorized: true };
}
