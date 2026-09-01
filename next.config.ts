import type { NextConfig } from "next";

function getRewriteBackendOrigin(): string {
  const raw =
    process.env.BACKEND_URL ||
    process.env.NEXT_PUBLIC_BACKEND_URL ||
    "http://localhost:5000";
  return raw.replace(/\/api$/i, "").replace(/\/+$/, "");
}

const nextConfig: NextConfig = {
  reactCompiler: true,
  async rewrites() {
    const origin = getRewriteBackendOrigin();
    return [
      {
        source: "/api/:path*",
        destination: `${origin}/api/:path*`,
      },
      {
        source: "/uploads/:path*",
        destination: `${origin}/uploads/:path*`,
      },
    ];
  },
};

export default nextConfig;
