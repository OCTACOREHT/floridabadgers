import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "cdn.sportmonks.com",
      },
      {
        protocol: "https",
        hostname: "upsl.com",
      },
    ],
  },
};

export default nextConfig;
