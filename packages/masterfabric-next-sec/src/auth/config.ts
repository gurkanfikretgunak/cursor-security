import type { NextAuthConfig } from "next-auth";
import {
  DEFAULT_SESSION_TIMEOUTS,
  type SessionTimeoutOptions,
} from "./types.js";

export type SecureCookieOptions = {
  /** Use Secure cookies (set true in production HTTPS). */
  useSecureCookies?: boolean;
};

/**
 * Shared Auth.js session + cookie defaults for SOC2/ISO access control.
 * Compose with providers/adapter in the consuming app.
 */
export function createAuthConfig(
  overrides: NextAuthConfig,
  options?: SessionTimeoutOptions & SecureCookieOptions,
): NextAuthConfig {
  const maxAge =
    options?.maxAgeSeconds ?? DEFAULT_SESSION_TIMEOUTS.maxAgeSeconds;
  const updateAge =
    options?.updateAgeSeconds ?? DEFAULT_SESSION_TIMEOUTS.updateAgeSeconds;
  const useSecureCookies =
    options?.useSecureCookies ?? process.env.NODE_ENV === "production";

  const {
    session: sessionOverride,
    cookies: cookiesOverride,
    pages: pagesOverride,
    ...rest
  } = overrides;

  return {
    ...rest,
    session: {
      strategy: "database",
      maxAge,
      updateAge,
      ...sessionOverride,
    },
    cookies: {
      sessionToken: {
        name: useSecureCookies
          ? "__Secure-authjs.session-token"
          : "authjs.session-token",
        options: {
          httpOnly: true,
          sameSite: "lax",
          path: "/",
          secure: useSecureCookies,
        },
      },
      ...cookiesOverride,
    },
    pages: {
      signIn: "/login",
      error: "/login",
      ...pagesOverride,
    },
    trustHost: rest.trustHost ?? true,
  };
}
