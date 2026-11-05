import type { NextConfig } from "next";

// Where Next proxies /v1/* requests. Keeping the browser on the same origin
// means auth cookies are first-party and CORS is not involved at all.
const API_PROXY_TARGET =
  process.env.API_PROXY_TARGET ||
  (process.env.NODE_ENV === "development"
    ? "http://127.0.0.1:8000"
    : "https://dltbackend.cc.cd");

const nextConfig: NextConfig = {
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  async rewrites() {
    return [
      {
        source: "/v1/:path*",
        destination: `${API_PROXY_TARGET}/v1/:path*`,
      },
    ];
  },
};

export default nextConfig;
