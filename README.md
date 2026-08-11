<p align="center">
  <img src="apps/web/public/brand/cursor/lockup-horizontal-2d-light.svg" alt="Cursor" width="220" />
</p>

<h1 align="center">Cursor Security</h1>

<p align="center">
  <strong>Agentic AI security</strong> — identity, least agency, audit, and containment<br/>
  for systems that act, not only answer.
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Node.js-20%2B-339933?style=flat-square&logo=node.js&logoColor=white" alt="Node.js 20+" />
  <img src="https://img.shields.io/badge/Next.js-16-000000?style=flat-square&logo=next.js&logoColor=white" alt="Next.js 16" />
  <img src="https://img.shields.io/badge/TypeScript-5-3178C6?style=flat-square&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Auth.js-v5-000000?style=flat-square&logo=auth0&logoColor=white" alt="Auth.js" />
  <img src="https://img.shields.io/badge/Postgres-16-4169E1?style=flat-square&logo=postgresql&logoColor=white" alt="Postgres 16" />
</p>

<p align="center">
  <img src="https://img.shields.io/badge/OWASP-ASVS%20L2-red?style=flat-square" alt="OWASP ASVS L2" />
  <img src="https://img.shields.io/badge/SOC%202-mapped-1F4E79?style=flat-square" alt="SOC 2 mapped" />
  <img src="https://img.shields.io/badge/ISO%2027001-mapped-0055A5?style=flat-square" alt="ISO 27001 mapped" />
  <img src="https://img.shields.io/badge/Developed%20with-Cursor-26251E?style=flat-square&logo=cursor&logoColor=white" alt="Developed with Cursor" />
</p>

<p align="center">
  <a href="./MANIFEST.md"><strong>MANIFEST.md</strong></a> ·
  <a href="./compliance/README.md"><strong>ISMS pack</strong></a> ·
  <a href="./packages/masterfabric-next-sec/README.md"><strong>masterfabric-next-sec</strong></a> ·
  <a href="https://cursor.com/brand"><strong>Cursor brand</strong></a>
</p>

---

## Why

Most AI security talk still centers on the model prompt. Agentic systems choose tools, keep memory, and take actions across your stack. The risk is not only a bad answer — it is an unauthorized write, a leaked secret, or a confused deputy with too much power.

**Cursor Security** ships a public guidance site, an authenticated control surface, a reusable Next.js security package, and an in-repo ISMS pack.

| Layer | What you get |
| --- | --- |
| Principles | Least agency, identity before action, prompt ≠ policy, blast-radius containment |
| Product | Magic-link auth, orgs/RBAC, live audit timeline, private channel sessions |
| Library | `masterfabric-next-sec` — Auth.js, Zod, CSP, rate limits, audit writers |
| Compliance | Policies, SoA, control matrix, evidence stubs → SOC 2 / ISO 27001 / ASVS L2 |

---

## Structure

```text
apps/web                        # Next.js — marketing + /app control surface
packages/masterfabric-next-sec  # Shared security primitives
compliance/                     # ISMS policies, SoA, control matrix, evidence
apps/web/public/brand/cursor/   # Official Cursor marks (Ambassador Studio)
```

<p align="center">
  <img src="apps/web/public/brand/cursor/cube-25d.svg" alt="Cursor cube" width="56" />
</p>

---

## Prerequisites

- **Node.js** 20+
- **Docker** (local Postgres) or Postgres 16+

---

## Setup

```bash
# Install workspaces
npm install

# Start Postgres
docker compose up -d

# Env
cp apps/web/.env.example apps/web/.env.local
# set AUTH_SECRET: openssl rand -base64 32

# Build security package
npm run build -w masterfabric-next-sec

# Migrate
npm run db:migrate

# Dev
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

| Route | Purpose |
| --- | --- |
| `/` | Public site + principles |
| `/security`, `/privacy` | Trust center |
| `/MANIFEST.md` | Agentic AI security manifesto |
| `/login` → `/app` | Magic link control surface (dev: check server console) |

---

## Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Next.js dev server |
| `npm run build` | Build package + web |
| `npm run typecheck` | Typecheck package + web |
| `npm run lint` | ESLint web |
| `npm run db:migrate` | Apply Drizzle migrations |

---

## Compliance

Start at [`compliance/README.md`](./compliance/README.md) and the [`control-matrix.md`](./compliance/control-matrix.md).

---

## Brand

Official Cursor logos are vendored from the [Cursor Ambassador Studio](https://kamilstanuch.github.io/cursor-ambassador-studio/#/library) asset library (see [cursor.com/brand](https://cursor.com/brand)).

Refer to the product as **Cursor** — not “Cursor AI” or “Cursor Code”.

---

<p align="center">
  <img src="apps/web/public/brand/cursor/cube-2d-light.svg" alt="Cursor" width="28" />
  <br/>
  <sub>Developed with <a href="https://cursor.com">Cursor</a> · Cursor Ambassador kit</sub>
</p>
