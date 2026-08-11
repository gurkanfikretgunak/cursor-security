# Secure Development / Change Management

## Requirements

1. All production code changes via pull request
2. At least one reviewer on `main` (configure branch protection)
3. CI must pass: install, build `masterfabric-next-sec`, typecheck, lint, build `@cursor-security/web`
4. Secrets never committed (`.env*` gitignored; use `.env.example`)
5. Dependencies locked (`package-lock.json`)
6. Vulnerability SLA: critical ≤ 7 days, high ≤ 30 days (best effort for transitive)

## Security requirements input

- OWASP ASVS L2 checklist in `control-matrix.md`
- Threat model updates on major features

## Branch protection checklist (GitHub)

- [ ] Require PR before merge
- [ ] Require status checks (CI)
- [ ] Restrict direct pushes to main
- [ ] Require conversation resolution
