import type { NextConfig } from "next";

const remoteHosts = (process.env.IMAGE_REMOTE_HOSTS ?? "")
  .split(",")
  .map((h) => h.trim())
  .filter(Boolean);

const nextConfig: NextConfig = {
  reactCompiler: true,
  images: {
    remotePatterns: remoteHosts.map((hostname) => ({
      // Local Supabase Storage is served over http; hosted projects are https.
      protocol: hostname === "127.0.0.1" || hostname === "localhost" ? "http" : "https",
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