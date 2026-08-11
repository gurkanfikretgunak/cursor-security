import type { NextConfig } from "next";
import { securityHeaders } from "masterfabric-next-sec/headers";

const isProd = process.env.NODE_ENV === "production";

const nextConfig: NextConfig = {
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
          },
        }),
      },
    ];
  },
};

export default nextConfig;
