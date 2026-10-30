import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "nlhdfbfrdytxwofddkde.supabase.co",
      },
    ],
  },
};

export default nextConfig;
