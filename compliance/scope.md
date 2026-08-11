# Scope statement

## Organization / product

- **Product:** Cursor Security (Agentic AI Security) — public guidance site + authenticated control surface
- **Repository:** `cursor-security` monorepo
- **Security library:** `masterfabric-next-sec`

## In-scope systems

| System | Description |
| --- | --- |
| `apps/web` | Next.js application (marketing, auth, orgs, audit UI) |
| `packages/masterfabric-next-sec` | Shared auth, validation, headers, rate-limit, audit helpers |
| PostgreSQL | Users, sessions, orgs, memberships, audit events |
| CI (GitHub Actions) | Build, typecheck, lint, dependency audit |
| Employee access paths | Git hosting, cloud hosting, database console (when used) |

## Trust services (SOC 2)

- **Security** (required)
- **Confidentiality** (customer/account data, audit logs)

Availability / Processing Integrity / Privacy can be added when SLAs and DPA commitments exist.

## ISO 27001 scope

Information security management for the design, development, and operation of the Cursor Security SaaS control surface and supporting repositories, cloud hosting, and datastore.

## Exclusions (justified)

| Exclusion | Justification |
| --- | --- |
| Full agent runtime / tool sandbox product | Not yet shipped; narrative only |
| Customer on-prem deployments | Not offered |
| PCI cardholder data environment | No card data processed |
| Physical office controls | Remote-first; physical security N/A or covered by coworking policy when applicable |

## Boundaries

```text
Browser → Next.js (RSC / Server Actions / Route Handlers)
       → Auth.js sessions (Postgres)
       → Application data (orgs, memberships, audit_events)
       → Subprocessors (hosting, DB, email)
```
