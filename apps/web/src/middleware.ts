import { NextResponse, type NextRequest } from "next/server";
import {
  applySecurityHeaders,
  createCspNonce,
} from "masterfabric-next-sec/headers";

export async function middleware(request: NextRequest) {
  const nonce = createCspNonce();
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);

  const isApp = request.nextUrl.pathname.startsWith("/app");
  const sessionCookie =
    request.cookies.get("__Secure-authjs.session-token") ??
    request.cookies.get("authjs.session-token") ??
    request.cookies.get("__Secure-next-auth.session-token") ??
    request.cookies.get("next-auth.session-token");

  if (isApp && !sessionCookie) {
    const login = new URL("/login", request.url);
    login.searchParams.set("callbackUrl", request.nextUrl.pathname);
    const redirect = NextResponse.redirect(login);
    return applySecurityHeaders(redirect, {
      nonce,
      cspReportOnly: process.env.NODE_ENV !== "production",
    });
  }

  const response = NextResponse.next({
    request: { headers: requestHeaders },
  });
  response.headers.set("x-nonce", nonce);
  return applySecurityHeaders(response, {
    nonce,
    cspReportOnly: process.env.NODE_ENV !== "production",
    cspDirectives: {
      "font-src": "'self' data: https://fonts.gstatic.com",
      "style-src": `'self' 'nonce-${nonce}' 'unsafe-inline' https://fonts.googleapis.com`,
      "script-src": `'self' 'nonce-${nonce}' 'strict-dynamic'`,
    },
  });
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|md)$).*)",
  ],
};
