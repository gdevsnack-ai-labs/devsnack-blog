import type { NextConfig } from "next";
import { RESEARCH_NOTE_REDIRECTS } from "./src/lib/research-note-migration";

const nextConfig: NextConfig = {
  turbopack: {
    root: process.cwd(),
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "i.ytimg.com" },
    ],
  },
  async redirects() {
    return Object.entries(RESEARCH_NOTE_REDIRECTS).map(([slug, destination]) => ({
      source: `/research/${slug}`,
      destination,
      permanent: true,
    }));
  },
};

export default nextConfig;
