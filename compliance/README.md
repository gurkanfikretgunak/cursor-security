# Cursor Security ISMS pack (SOC 2 + ISO 27001 + ASVS)

This folder is the **management-system and evidence spine** for certifier programs. Technical controls live in:

- [`packages/masterfabric-next-sec`](../packages/masterfabric-next-sec) — reusable Next.js security library
- [`apps/web`](../apps/web) — Cursor Security product control surface

## How auditors should navigate

1. Read [`scope.md`](./scope.md)
2. Review [`threat-model.md`](./threat-model.md) and [`risk-register.md`](./risk-register.md)
3. Use [`control-matrix.md`](./control-matrix.md) as the single map: **ISO Annex A ↔ SOC 2 TSC ↔ ASVS ↔ code**
4. Sample [`policies/`](./policies/) and [`evidence/`](./evidence/)
5. Confirm implementation in the linked source paths

## Certification path (operating)

| Step | Artifact |
| --- | --- |
| Ready for observation | Controls implemented + evidence checklists started |
| SOC 2 Type I | Design of controls at a point in time |
| SOC 2 Type II | Operating effectiveness over ≥3 months (prefer 6–12) |
| ISO 27001 Stage 1 | Documentation / SoA readiness |
| ISO 27001 Stage 2 | Implementation sampling |
| Ongoing | Surveillance audits, annual pen test, risk refresh |

This pack **does not replace** a CPA firm (SOC 2) or accredited ISO certification body.
