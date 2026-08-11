# Logging & Monitoring

## Application audit events

Stored in `audit_events` (see `masterfabric-next-sec/audit`):

- `auth.login` / `auth.logout` / `auth.failure`
- `org.created` / `org.member_added`
- `rbac.denied` (when instrumented)
- `admin.action` / `data.export` (when features land)

## Rules

- Do not log passwords, magic-link tokens, or raw session cookies
- Prefer user IDs over emails in long-retention logs when possible
- Retain audit events ≥ 90 days for SOC 2 sampling (adjust to policy)

## Monitoring

- Hosting provider uptime/error monitors
- Review auth.failure spikes during incidents
