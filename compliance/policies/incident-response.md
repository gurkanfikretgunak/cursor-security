# Incident Response

## Severity

| Level | Example |
| --- | --- |
| SEV1 | Confirmed breach / mass data exposure |
| SEV2 | Auth bypass / privilege escalation in prod |
| SEV3 | Limited abuse, no confirmed data loss |
| SEV4 | Suspicious activity, contained |

## Process

1. **Detect** — alerts, audit anomalies, vuln reports (`/security/vulnerability-disclosure`)
2. **Contain** — revoke sessions, rotate secrets, block abusive IPs/keys
3. **Eradicate** — patch, redeploy, verify
4. **Recover** — restore service, monitor
5. **Learn** — postmortem within 5 business days for SEV1–2

## Contacts

- Security: security@example.com (replace)
- Public page: `/security`

## Evidence

Store tickets, timelines, and decisions under `compliance/evidence/incidents/` (create when needed).
