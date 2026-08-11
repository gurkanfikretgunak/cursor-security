# Statement of Applicability (ISO 27001:2022 Annex A) — starter

Status: **Apply** / **Exclude**. Evidence links to `control-matrix.md` and code.

| Annex A | Control (short) | Apply? | Justification / notes |
| --- | --- | --- | --- |
| A.5.1 | Policies for information security | Apply | `policies/information-security.md` |
| A.5.2 | Information security roles | Apply | `scope.md` RACI in README |
| A.5.3 | Segregation of duties | Apply | RBAC owner/admin/member |
| A.5.7 | Threat intelligence | Apply | Threat model + vuln disclosure |
| A.5.10 | Acceptable use | Apply | `policies/acceptable-use.md` |
| A.5.15 | Access control | Apply | Auth.js + org RBAC |
| A.5.16 | Identity management | Apply | Magic-link identity |
| A.5.17 | Authentication information | Apply | Session secrets, no passwords at rest in v1 |
| A.5.19 | Supplier relationships | Apply | `policies/vendors.md` |
| A.5.23 | Information security for cloud | Apply | Hosting + DB subprocessors |
| A.5.24 | Incident management planning | Apply | `policies/incident-response.md` |
| A.5.29 | Information security during disruption | Apply | `policies/backup-bc.md` |
| A.5.31 | Legal/regulatory | Apply | Privacy page + counsel review before prod |
| A.5.34 | Privacy and PII | Apply | `apps/web` privacy page |
| A.6.1 | Screening | Exclude* | Solo/small team — document when hiring |
| A.6.3 | Awareness training | Apply | `policies/hr-training.md` |
| A.6.8 | Disciplinary process | Exclude* | Until HR function exists |
| A.8.1 | User endpoint devices | Apply | Acceptable use + MDM when fleet grows |
| A.8.2 | Privileged access | Apply | Org admin/owner roles + MFA roadmap |
| A.8.3 | Information access restriction | Apply | Server-side authorization |
| A.8.5 | Secure authentication | Apply | Magic link + secure cookies |
| A.8.8 | Technical vulnerability mgmt | Apply | CI audit + patch SLA in SDLC |
| A.8.9 | Configuration management | Apply | IaC/docs + protected main |
| A.8.10 | Information deletion | Apply | Account deletion process (privacy) |
| A.8.12 | Data leakage prevention | Apply | CSP, no secrets in client, log redaction guidance |
| A.8.15 | Logging | Apply | `audit_events` + `policies/logging.md` |
| A.8.16 | Monitoring | Apply | Auth failure events + hosting monitors |
| A.8.24 | Use of cryptography | Apply | TLS, `AUTH_SECRET`, DB encryption at rest (provider) |
| A.8.25 | Secure development life cycle | Apply | `policies/sdlc.md` |
| A.8.26 | Application security requirements | Apply | ASVS L2 matrix |
| A.8.28 | Secure coding | Apply | Zod, AppError, PR review |
| A.8.29 | Security testing | Apply | CI + pen test before Type II |
| A.8.32 | Change management | Apply | PR + CI required |

\*Revisit exclusions when headcount > 1 FTE or enterprise customers require them.

Full formal SoA should be approved by management and versioned at each ISO surveillance cycle.
