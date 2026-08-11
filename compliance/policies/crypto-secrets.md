# Cryptography & Secrets

## Requirements

- TLS everywhere in production
- `AUTH_SECRET` ≥ 32 bytes entropy
- Database credentials only in host secret store / env
- No secrets in client bundles (`NEXT_PUBLIC_*` only for public config)
- Prefer provider-managed encryption at rest for Postgres

## Rotation

- Rotate `AUTH_SECRET` and DB credentials after suspected exposure
- Document rotation in incident tickets
