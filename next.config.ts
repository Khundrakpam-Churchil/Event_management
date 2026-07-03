import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // Required for server actions and advanced features
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },
};

export default nextConfig;
