# Control matrix — ISO ↔ SOC 2 ↔ ASVS ↔ code

ASVS target: **Level 2**. Status: Pass / Partial / Fail / N/A.

| Control | ISO Annex A | SOC 2 TSC | ASVS | Implementation evidence | Status |
| --- | --- | --- | --- | --- | --- |
| Secure session cookies | A.8.5 | CC6.1 / CC6.6 | V3.2 / V3.3 | `packages/masterfabric-next-sec/src/auth/config.ts` (`httpOnly`, `sameSite`, `secure`) | Pass |
| Session timeouts | A.5.15 / A.8.5 | CC6.1 | V3.3 | `DEFAULT_SESSION_TIMEOUTS` in `auth/types.ts` (8h max / 1h update) | Pass |
| Authentication (magic link) | A.8.5 | CC6.1 | V2.1 | `apps/web/src/auth.ts`, `apps/web/src/app/actions/auth.ts` | Pass |
| Server-side authN gate | A.8.3 | CC6.1 | V4.1 | `requireUser` in package; `/app` pages + middleware cookie gate | Pass |
| Org RBAC / anti-IDOR | A.8.2 / A.8.3 | CC6.1 | V4.1 / V4.2 | `requireOrgRole`, `assertOrgMember`; audit page admin+ | Pass |
| Input validation | A.8.28 | CC7.1 | V5.1 | `actionHandler` / Zod in `validate/` + org/auth actions | Pass |
| Security headers + CSP | A.8.16 / A.8.12 | CC6.6 | V14.4 | `headers/` package; `apps/web/next.config.ts`; `middleware.ts` | Pass |
| Rate limiting | A.8.16 | CC7.2 | V11.1 | `rate-limit/` presets `auth`/`sensitive` on login & invites | Pass |
| Audit logging | A.8.15 | CC7.2 | V7.1 | `audit/` + `audit_events` table + `/app/org/[orgId]/audit` | Pass |
| Safe error handling | A.8.28 | CC7.1 | V7.4 / V14.3 | `AppError` / `toPublicError` — no stack leakage to clients | Pass |
| Secrets management | A.8.24 | CC6.1 | V2.10 / V13 | `.env.example`, gitignore `.env*`, server-only DB/auth | Pass |
| Encrypted transit | A.8.24 | CC6.7 | V9.1 | HSTS in prod headers; TLS at host | Partial* |
| Dependency / SCA | A.8.8 | CC7.1 | V14.2 | `.github/workflows/ci.yml` `npm audit` | Pass |
| Secure SDLC / change | A.8.25 / A.8.32 | CC8.1 | V14.1 | `policies/sdlc.md` + CI workflow | Pass |
| Incident response | A.5.24 | CC7.3 / CC7.4 | V1.7 | `policies/incident-response.md` + vuln disclosure page | Pass |
| Vendor management | A.5.19 | CC9.2 | V1.6 | `policies/vendors.md` + `/security` subprocessors | Pass |
| Backups | A.5.29 / A.8.13 | A1.2 (if Availability) | V14 | `policies/backup-bc.md` + restore drill template | Partial* |
| Vulnerability disclosure | A.5.7 | CC7.1 | V14 | `/security/vulnerability-disclosure` | Pass |
| Privacy / PII notice | A.5.34 | Confidentiality C1 | V8 | `/privacy` | Pass |
| MFA for privileged users | A.8.2 / A.8.5 | CC6.1 | V2.8 | Documented roadmap in package README + risk R9 | Partial |
| Pen test | A.8.29 | CC7.1 | V1.5 | Planned before Type II — store under `evidence/pen-tests/` | Fail† |

\*Partial until production host TLS/HSTS and managed DB PITR are confirmed in your environment.  
†Fail until first external pen test is completed and findings tracked.

## Observation / ops checklist (SOC 2 Type II / ISO Stage 2)

| Cadence | Activity | Evidence path |
| --- | --- | --- |
| Continuous | CI green on main | GitHub Actions |
| Continuous | Audit events written | DB / admin audit UI |
| Quarterly | Access reviews | `evidence/access-reviews.md` |
| On change | Joiner/leaver | `evidence/joiner-leaver.md` |
| Annual | Restore drill | `evidence/backup-restore-drill.md` |
| Annual | Risk register refresh | `risk-register.md` |
| Annual | Pen test | `evidence/pen-tests/` |
| Annual | Policy review | `policies/*` |

## ASVS L2 focus areas covered

- V2 Authentication — magic link + secure session cookies  
- V3 Session management — timeouts, HttpOnly  
- V4 Access control — org RBAC server-side  
- V5 Validation — Zod wrappers  
- V7 Error handling & logging — AppError + audit  
- V11 Business logic — rate limits on auth/sensitive  
- V14 Configuration — headers, CI, secrets hygiene  
