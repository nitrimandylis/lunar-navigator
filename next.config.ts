import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  cacheComponents: true,
  partialPrefetching: true,
  // The tool used to live at "/", where the homepage is now. A link from
  // before the move carries a site, a time or a plan, so it goes on to the
  // tool at "/app". The query is passed through unchanged.
  async redirects() {
    const oldLinkParts = ["site", "time", "plan"];
    return oldLinkParts.map((part) => ({
      source: "/",
      has: [{ type: "query" as const, key: part }],
      destination: "/app",
      permanent: false,
    }));
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
