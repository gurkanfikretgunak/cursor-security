# Vendor / Third-Party Risk

## Subprocessors (typical)

| Vendor class | Data | Review |
| --- | --- | --- |
| App hosting / CDN | Traffic, logs | SOC 2 / ISO report annually |
| Postgres provider | All app data | SOC 2 / ISO + encryption at rest |
| Email delivery | Email addresses, magic links | SOC 2 / DPA |

## Process

1. Inventory vendors in `/security` subprocessors list
2. Collect SOC/ISO reports under NDA before production customer launch
3. Re-review on contract renewal or material scope change
