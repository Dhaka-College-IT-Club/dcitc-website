import type { NextConfig } from "next";

const localHosts = new Set(["127.0.0.1", "localhost", "0.0.0.0", "::1"]);

/** Host of the Supabase Storage public URL, if the project configures one. */
function storageHostname(): string | null {
  const raw = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  if (!raw) return null;
  try {
    return new URL(raw).hostname;
  } catch {
    return null;
  }
}

// Uploads live in Supabase Storage (bucket public URL). Both the explicit
// override and the storage host are allowed, so a hosted deployment only has to
// set NEXT_PUBLIC_SUPABASE_URL.
const remoteHosts = [
  ...new Set(
    [process.env.IMAGE_REMOTE_HOSTS, storageHostname()]
      .filter(Boolean)
      .flatMap((value) => value!.split(","))
      .map((host) => host.trim().toLowerCase())
      .filter(Boolean),
  ),
];

const nextConfig: NextConfig = {
  reactCompiler: true,
  // Read by lib/images.ts to decide whether next/image may optimize a host.
  env: {
    NEXT_PUBLIC_IMAGE_HOSTS: remoteHosts.join(","),
  },
  images: {
    // Next 16 refuses upstream hosts that resolve to loopback/private IPs
    // (SSRF guard). Local Supabase Storage is exactly that, so allow it only
    // when a local host is explicitly configured.
    dangerouslyAllowLocalIP: remoteHosts.some((host) => localHosts.has(host)),
    remotePatterns: remoteHosts.map((hostname) => ({
      protocol: localHosts.has(hostname) ? "http" : "https",
      hostname,
      pathname: "/storage/v1/object/public/**",
    })),
  },
  async rewrites() {
    return [
      {
        source: "/api/v1/:path*",
        destination: `${process.env.API_ORIGIN ?? "http://localhost:4000"}/api/v1/:path*`,
      },
    ];
  },
  async redirects() {
    return [
      { source: "/admin1841", destination: "/admin", permanent: true },
      { source: "/admin1841/dashboard", destination: "/admin", permanent: true },
      { source: "/admin1841/:path*", destination: "/admin/:path*", permanent: true },
    ];
  },
};

export default nextConfig;
