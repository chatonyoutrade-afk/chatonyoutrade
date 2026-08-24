import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    root: process.cwd(),
    ...(process.env.VERCEL
      ? {
          resolveAlias: {
            "cloudflare:workers": "./lib/vercel-cloudflare-workers.ts",
          },
        }
      : {}),
  },
};

export default nextConfig;
