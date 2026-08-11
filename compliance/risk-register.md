# Risk register (starter)

Likelihood / impact: 1 (low) – 5 (high). Treatment: Mitigate / Accept / Transfer / Avoid.

| ID | Risk | L | I | Score | Treatment | Owner | Status |
| --- | --- | --- | --- | --- | --- | --- | --- |
| R1 | Unauthorized access to org data (IDOR) | 3 | 5 | 15 | Mitigate — server RBAC + tests | Eng | Open→Mitigating |
| R2 | Session hijack via XSS | 2 | 5 | 10 | Mitigate — CSP, HttpOnly cookies | Eng | Mitigating |
| R3 | Auth brute / email bombing | 4 | 3 | 12 | Mitigate — rate limits | Eng | Mitigating |
| R4 | Secret exposure in git/CI logs | 2 | 5 | 10 | Mitigate — gitignore, env examples, CI hygiene | Eng | Mitigating |
| R5 | Dependency CVE in Next/auth stack | 3 | 4 | 12 | Mitigate — audit in CI, patch SLA | Eng | Mitigating |
| R6 | Backup / restore failure | 2 | 4 | 8 | Mitigate — provider PITR + annual drill | Ops | Planned |
| R7 | Insider abuse of admin role | 2 | 4 | 8 | Mitigate — audit log + access reviews | Ops | Mitigating |
| R8 | Vendor outage (host/DB) | 3 | 3 | 9 | Transfer — vendor SLA + status page | Ops | Accepted w/ monitoring |
| R9 | Incomplete MFA for privileged access | 3 | 4 | 12 | Mitigate — IdP/TOTP roadmap documented | Eng | Planned |
| R10 | Evidence gaps for Type II period | 3 | 3 | 9 | Mitigate — evidence checklists | Security | Planned |

Review cadence: at least quarterly and after major architecture changes.
