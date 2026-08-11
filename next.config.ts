import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  env: {
    NEXT_PUBLIC_SUPABASE_URL: "https://qbkfwnddxycixnqvfokq.supabase.co",
    NEXT_PUBLIC_SUPABASE_ANON_KEY: "eyJhbG...o1Jk",
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "i.ytimg.com" },
    ],
  },
};

export default nextConfig;
