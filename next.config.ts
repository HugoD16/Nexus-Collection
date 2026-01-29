import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      allowedOrigins: [
        "nexus.hugo-dehay.fr",
        "https://nexus.hugo-dehay.fr",
        "100.124.82.202:3001",
        "http://100.124.82.202:3001"
      ]
    }
  }
};

export default nextConfig;
