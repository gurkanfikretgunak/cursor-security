# masterfabric-next-sec

Reusable Next.js security controls for **Auth.js + Zod + CSP + rate limits + audit logging**.

Maps to OWASP ASVS L2 technical controls and supports SOC 2 / ISO 27001 evidence via the repo `compliance/` pack.

## Install (workspace)

```json
{
  "dependencies": {
    "masterfabric-next-sec": "*",
    "next-auth": "^5.0.0-beta.29",
    "zod": "^3.25.0"
  }
}
```

Build the package before the app:

```bash
npm run build -w masterfabric-next-sec
```

## Quick wire-up (≈15 minutes)

### 1. Security headers

```ts
// next.config.ts
import type { NextConfig } from "next";
import { securityHeaders } from "masterfabric-next-sec/headers";

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders({
          cspReportOnly: process.env.NODE_ENV !== "production",
          hstsMaxAge: process.env.NODE_ENV === "production" ? 15552000 : undefined,
        }),
      },
    ];
  },
};

export default nextConfig;
```

### 2. Auth.js config defaults

```ts
import { createAuthConfig } from "masterfabric-next-sec/auth";
import NextAuth from "next-auth";

export const { handlers, auth, signIn, signOut } = NextAuth(
  createAuthConfig({
    providers: [/* Email / credentials */],
    adapter: /* Drizzle adapter */,
    callbacks: {
      session({ session, user }) {
        if (session.user) session.user.id = user.id;
        return session;
      },
    },
  }),
);
```

### 3. Server Action validation

```ts
import { z } from "zod";
import { actionHandler } from "masterfabric-next-sec/validate";
import { requireUser } from "masterfabric-next-sec/auth";
import { auth } from "@/auth";

const Schema = z.object({ name: z.string().min(1).max(80) });

export const createThing = actionHandler(Schema, async (input) => {
  const session = await auth();
  const user = requireUser(session);
  // ...
  return { id: "..." };
});
```

### 4. Audit writer

```ts
import { createAuditWriter } from "masterfabric-next-sec/audit";

export const audit = createAuditWriter(async (event) => {
  await db.insert(auditEvents).values({ ...event, id: crypto.randomUUID() });
});
```

### 5. Rate limit

```ts
import { createRateLimiter } from "masterfabric-next-sec/rate-limit";

export const limiter = createRateLimiter();
await limiter.check(ip, "auth");
```

## Subpath exports

| Import | Purpose |
| --- | --- |
| `masterfabric-next-sec/auth` | `requireUser`, `requireRole`, `createAuthConfig` |
| `masterfabric-next-sec/headers` | CSP + security headers |
| `masterfabric-next-sec/validate` | Zod `actionHandler` / `apiHandler` |
| `masterfabric-next-sec/audit` | Typed audit events |
| `masterfabric-next-sec/rate-limit` | Memory store + presets |
| `masterfabric-next-sec/errors` | `AppError`, safe client mapping |

## Auth handshake + device JWT + private channels

1. `POST /api/auth/handshake` → barrier cookie + anonymous **device JWT** + pre-auth `channelPath` (`/api/c/<id>/preflight`)
2. Magic link requires matching `handshakeId` ↔ barrier (barrier kept for blend)
3. After login `POST /api/auth/bind` → **blended JWT** (user + device + barrier fingerprint) + user-private channel `/api/c/<id>/me`
4. Channel routes call `verifyChannelAccess` — wrong path / device / blend → denied + audited

```ts
import {
  createAuthHandshake,
  issueDeviceJwt,
  issueBlendedJwt,
  verifyChannelAccess,
} from "masterfabric-next-sec/auth";
```

## Session timeouts (access control)

Defaults from `createAuthConfig`:

- Absolute max age: **8 hours**
- Sliding update age: **1 hour**
- Cookies: `HttpOnly`, `SameSite=Lax`, `Secure` in production

Override via `SessionTimeoutOptions` for your threat model / MFA policy.

## MFA note

This package documents MFA for privileged roles. Wire TOTP or enforce IdP MFA at the identity provider; call `requireRole(..., "admin")` on privileged Server Actions regardless of UI.
