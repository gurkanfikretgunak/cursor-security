# Access Control Policy

## Principles

- Least privilege
- Unique user identity (no shared prod logins)
- MFA for privileged cloud/Git access (organizational IdP)
- Quarterly access reviews

## Application roles

| Role | Capabilities |
| --- | --- |
| member | Read org resources granted to members |
| admin | Invite members, view audit log |
| owner | Full org administration |

Enforcement is **server-side** via `requireUser` / `requireOrgRole` in `masterfabric-next-sec` and `apps/web`.

## Sessions

- Database sessions via Auth.js
- HttpOnly, SameSite=Lax, Secure (production)
- Default absolute max age: 8 hours

## Joiner / mover / leaver

See [`../evidence/access-reviews.md`](../evidence/access-reviews.md).
