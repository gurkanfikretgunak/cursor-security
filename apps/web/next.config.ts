import path from "node:path";
import { fileURLToPath } from "node:url";
import type { NextConfig } from "next";
import { securityHeaders } from "masterfabric-next-sec/headers";

const isProd = process.env.NODE_ENV === "production";
const repoRoot = path.join(fileURLToPath(new URL(".", import.meta.url)), "../..");
const backendOrigin = process.env.BACKEND_URL || process.env.NEXT_PUBLIC_BACKEND_URL;

const nextConfig: NextConfig = {
  outputFileTracingRoot: repoRoot,
  transpilePackages: ["masterfabric-next-sec"],
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders({
          // Report-Only in non-prod; enforce in production once stable.
          cspReportOnly: !isProd,
          hstsMaxAge: isProd ? 15_552_000 : undefined,
          cspDirectives: {
            // next/font Google fonts
            "font-src": "'self' data: https://fonts.gstatic.com",
            "style-src": "'self' 'unsafe-inline' https://fonts.googleapis.com",
            "connect-src": backendOrigin
              ? `'self' ${backendOrigin}`
              : "'self'",
          },
        }),
      },
    ];
  },
};

export default nextConfig;
