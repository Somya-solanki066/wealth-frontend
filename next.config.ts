import type { NextConfig } from "next";

function firstEnvUrl(value?: string | null): string {
  if (!value) return "";
  return (
    value
      .split(/[,;\n]+/)
      .map((part) => part.trim().replace(/^["']|["']$/g, ""))
      .filter(Boolean)[0] || ""
  );
}

function getRewriteBackendOrigin(): string {
  const raw =
    firstEnvUrl(process.env.BACKEND_URL) ||
    firstEnvUrl(process.env.NEXT_PUBLIC_BACKEND_URL) ||
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
