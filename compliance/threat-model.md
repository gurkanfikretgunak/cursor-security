# Threat model (application)

## Assets

| Asset | Classification |
| --- | --- |
| User email / identity | Confidential |
| Session tokens | Restricted |
| Organization membership / roles | Confidential |
| Audit logs | Confidential |
| `AUTH_SECRET`, DB credentials | Restricted |
| Public manifest / marketing | Public |

## Actors

- Anonymous internet user
- Authenticated member / admin / owner
- Malicious insider (compromised account)
- Supply-chain attacker (dependency)

## Trust boundaries

1. Browser (untrusted) → Server (trusted for authZ)
2. Server → Postgres
3. Server → Email/SMTP provider
4. CI / developers → production secrets (must be gated)

## Top abuse cases

| ID | Scenario | Mitigations |
| --- | --- | --- |
| T1 | Account takeover via session theft | HttpOnly Secure cookies, short maxAge, HTTPS/HSTS |
| T2 | IDOR across organizations | `requireOrgRole` on every org-scoped action/page |
| T3 | Credential stuffing / magic-link spam | Rate limit preset `auth` |
| T4 | XSS → session abuse | CSP nonce path, React escaping, no `dangerouslySetInnerHTML` |
| T5 | Privilege escalation via client tampering | RBAC enforced only on server |
| T6 | Audit log tampering | Append-only insert pattern; no update/delete APIs |
| T7 | Secret leakage in client bundle | No `NEXT_PUBLIC_` for secrets; server-only auth/db |
| T8 | Dependency compromise | Lockfile, `npm audit` in CI, PR reviews |

## Data flow (happy path)

1. User requests magic link (`requestMagicLink` + rate limit)
2. Auth.js stores verification token; email/console delivers URL
3. User completes sign-in; database session cookie set
4. `/app/*` middleware requires session cookie presence
5. Server Actions call `requireUser` + Zod + org RBAC + audit write
