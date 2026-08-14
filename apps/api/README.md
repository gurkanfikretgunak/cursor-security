# cursor-security-api

Go backend for the Cursor Security lab. Layout follows [masterfabric-go](https://github.com/gurkanfikretgunak/masterfabric-go) (`cmd/`, `internal/shared`, Chi, pgx). Auth.js sessions stay on Vercel; org, member, audit, and scan persistence live here.

## Contract (1-1 with the previous Node API)

| Method | Path | Body |
| --- | --- | --- |
| `GET` | `/`, `/health` | `{ "ok": true, "service": "cursor-security-api" }` |
| `GET` | `/api/v1/status` | `{ "ok": true, "service": "cursor-security-api", "database": "connected" \| "disconnected" \| "error" }` |
| `OPTIONS` | `*` | `204` + CORS |
| `*` | other | `{ "error": "not_found" }` `404` |

Product routes (Next.js sends `X-User-Id` / `X-User-Email`, optional `X-Service-Key`):

| Method | Path |
| --- | --- |
| `GET`, `POST` | `/api/v1/orgs` |
| `GET`, `POST` | `/api/v1/orgs/{id}/members` |
| `GET`, `POST` | `/api/v1/audit` |
| `GET`, `POST` | `/api/v1/scans` |

Also exposes masterfabric-go health probes:

- `GET /health/live`
- `GET /health/ready` (Postgres only)

Binds `0.0.0.0:$PORT` (default `10000`). Uses `DATABASE_URL` when present.

```bash
cd apps/api
go test ./...
PORT=10000 go run ./cmd/server
```
