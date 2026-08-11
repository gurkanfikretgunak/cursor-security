export type SecurityHeadersOptions = {
  /** When true, emit Content-Security-Policy-Report-Only instead of enforce. */
  cspReportOnly?: boolean;
  /** Extra CSP directives merged into defaults (override by key). */
  cspDirectives?: Partial<Record<CspDirectiveName, string>>;
  /** CSP nonce for script-src / style-src. */
  nonce?: string;
  /** Frame ancestors; default 'none'. */
  frameAncestors?: string;
  /** Permissions-Policy value. */
  permissionsPolicy?: string;
  /** HSTS max-age seconds; omit to skip (useful on localhost). */
  hstsMaxAge?: number;
};

export type CspDirectiveName =
  | "default-src"
  | "script-src"
  | "style-src"
  | "img-src"
  | "font-src"
  | "connect-src"
  | "frame-ancestors"
  | "base-uri"
  | "form-action"
  | "object-src"
  | "frame-src"
  | "worker-src";

export type HeaderTuple = { key: string; value: string };

export function buildCsp(options: SecurityHeadersOptions = {}): string {
  const nonce = options.nonce;
  const scriptSrc = nonce
    ? `'self' 'nonce-${nonce}' 'strict-dynamic'`
    : `'self' 'unsafe-inline'`;
  const styleSrc = nonce
    ? `'self' 'nonce-${nonce}'`
    : `'self' 'unsafe-inline'`;

  const directives: Record<CspDirectiveName, string> = {
    "default-src": "'self'",
    "script-src": scriptSrc,
    "style-src": styleSrc,
    "img-src": "'self' data: blob:",
    "font-src": "'self' data:",
    "connect-src": "'self'",
    "frame-ancestors": options.frameAncestors ?? "'none'",
    "base-uri": "'self'",
    "form-action": "'self'",
    "object-src": "'none'",
    "frame-src": "'none'",
    "worker-src": "'self' blob:",
    ...options.cspDirectives,
  };

  return Object.entries(directives)
    .map(([k, v]) => `${k} ${v}`)
    .join("; ");
}

/** Static security headers suitable for next.config.ts `headers()`. */
export function securityHeaders(
  options: SecurityHeadersOptions = {},
): HeaderTuple[] {
  const csp = buildCsp(options);
  const cspKey = options.cspReportOnly
    ? "Content-Security-Policy-Report-Only"
    : "Content-Security-Policy";

  const headers: HeaderTuple[] = [
    { key: cspKey, value: csp },
    { key: "X-Content-Type-Options", value: "nosniff" },
    { key: "X-Frame-Options", value: "DENY" },
    { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
    {
      key: "Permissions-Policy",
      value:
        options.permissionsPolicy ??
        "camera=(), microphone=(), geolocation=(), payment=()",
    },
    { key: "X-DNS-Prefetch-Control", value: "off" },
    {
      key: "Cross-Origin-Opener-Policy",
      value: "same-origin",
    },
  ];

  if (options.hstsMaxAge != null && options.hstsMaxAge > 0) {
    headers.push({
      key: "Strict-Transport-Security",
      value: `max-age=${options.hstsMaxAge}; includeSubDomains`,
    });
  }

  return headers;
}

/** Apply security headers onto a Next.js middleware Response. */
export function applySecurityHeaders(
  response: Response,
  options: SecurityHeadersOptions = {},
): Response {
  for (const { key, value } of securityHeaders(options)) {
    response.headers.set(key, value);
  }
  return response;
}

/** Cryptographically random nonce for CSP (Edge-safe). */
export function createCspNonce(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  let binary = "";
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary);
}
