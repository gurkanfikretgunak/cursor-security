<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/gurkanfikretgunak/cursor-security/main/apps/web/public/brand/cursor/lockup-horizontal-2d-dark.svg" />
    <img src="https://raw.githubusercontent.com/gurkanfikretgunak/cursor-security/main/apps/web/public/brand/cursor/lockup-horizontal-2d-light.svg" alt="Cursor" width="240" />
  </picture>
</p>

<h1 align="center">Cursor Security</h1>

<p align="center">
  <strong>Agentic AI security</strong> — identity, least agency, audit, and containment<br/>
  for systems that act, not only answer.
</p>

<p align="center">
  <a href="https://github.com/gurkanfikretgunak/cursor-security"><img src="https://img.shields.io/badge/GitHub-cursor--security-181717?style=flat-square&logo=github&logoColor=white" alt="GitHub" /></a>
  <img src="https://img.shields.io/badge/Node.js-20%2B-339933?style=flat-square&logo=node.js&logoColor=white" alt="Node.js 20+" />
  <img src="https://img.shields.io/badge/Next.js-16-000000?style=flat-square&logo=nextdotjs&logoColor=white" alt="Next.js 16" />
  <img src="https://img.shields.io/badge/TypeScript-5-3178C6?style=flat-square&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Auth.js-v5-black?style=flat-square&logo=auth0&logoColor=white" alt="Auth.js" />
  <img src="https://img.shields.io/badge/Postgres-16-4169E1?style=flat-square&logo=postgresql&logoColor=white" alt="Postgres 16" />
  <img src="https://img.shields.io/badge/Drizzle-ORM-C5F74F?style=flat-square&logo=drizzle&logoColor=black" alt="Drizzle ORM" />
</p>

<p align="center">
  <a href="https://owasp.org/www-project-application-security-verification-standard/"><img src="https://img.shields.io/badge/OWASP-ASVS%20L2-red?style=flat-square&logo=owasp&logoColor=white" alt="OWASP ASVS L2" /></a>
  <a href="https://www.aicpa-cima.com/topic/audit-assurance/audit-and-assurance-greater-than-soc-2"><img src="https://img.shields.io/badge/SOC%202-mapped-1F4E79?style=flat-square" alt="SOC 2 mapped" /></a>
  <a href="https://www.iso.org/standard/27001"><img src="https://img.shields.io/badge/ISO%2027001-mapped-0055A5?style=flat-square" alt="ISO 27001 mapped" /></a>
  <a href="https://owasp.org/www-project-top-10-for-large-language-model-applications/"><img src="https://img.shields.io/badge/OWASP-LLM%20Top%2010-orange?style=flat-square&logo=owasp&logoColor=white" alt="OWASP LLM Top 10" /></a>
  <a href="https://www.nist.gov/itl/ai-risk-management-framework"><img src="https://img.shields.io/badge/NIST-AI%20RMF-003C71?style=flat-square" alt="NIST AI RMF" /></a>
  <a href="https://cursor.com"><img src="https://img.shields.io/badge/Developed%20with-Cursor-26251E?style=flat-square&labelColor=edecec&color=26251E" alt="Developed with Cursor" /></a>
</p>

<p align="center">
  <a href="#table-of-contents"><strong>TOC</strong></a> ·
  <a href="#security-mcp-for-cursor"><strong>Security MCP</strong></a> ·
  <a href="#wiki--agentic-ai-security"><strong>Wiki</strong></a> ·
  <a href="./MANIFEST.md"><strong>Manifest</strong></a> ·
  <a href="./compliance/README.md"><strong>ISMS</strong></a> ·
  <a href="./packages/masterfabric-next-sec/README.md"><strong>Library</strong></a> ·
  <a href="./packages/cursor-security-mcp/README.md"><strong>MCP</strong></a> ·
  <a href="#sources--further-reading"><strong>Sources</strong></a> ·
  <a href="https://cursor.com/brand"><strong>Brand</strong></a>
</p>

<p align="center">
  <sub>
    Author
    <a href="https://github.com/gurkanfikretgunak"><strong>Gürkan Fikret Günak</strong></a>
    · <a href="https://cursor.com">Cursor</a> Ambassador
    · <a href="https://gurkanfikretgunak.com">Website</a>
    · <a href="https://twitter.com/gurkandev">@gurkandev</a>
  </sub>
</p>

---

## Security MCP for Cursor

### Ship code with a security co-pilot in the IDE

**[`@cursor-security/mcp`](./packages/cursor-security-mcp)** turns your Cursor session into a living security review board. Point the agent at any repository and it scores posture across **secrets, client-side, backend/API, dependencies, config/infra, and project hygiene** — then returns file-level findings the same chat can fix.

> **One install. Six scanners. Nine MCP tools. Full-stack visibility.**  
> Not a vague checklist — concrete recommendations for React/Next clients, Node/Python APIs, Docker, CI, and supply chain.

| Domain | What it checks |
| --- | --- |
| **Secrets** | Hardcoded API keys, JWTs, private keys, committed `.env` files |
| **Client** | XSS sinks, token-in-`localStorage`, CSP gaps, insecure HTTP |
| **Backend** | SQLi/command patterns, CORS `*`, auth gaps, cookie flags, rate limits |
| **Dependencies** | Lockfiles, risky packages, floating versions, dangerous npm scripts |
| **Config** | `.gitignore`, Docker root user, CI security jobs, headers, `.npmrc` tokens |
| **Project** | README/license/tests, Node engines, TypeScript strictness |

**Ask the agent:**

- “Run a full security scan on this repo and summarize the top risks.”
- “Check client-side auth token storage and CSP.”
- “Audit backend routes for missing auth and open CORS.”
- “What’s our security score, and what should we fix first?”

```bash
npm install
npm run build -w @cursor-security/mcp
```

Cursor → **Settings → MCP** (see [`mcp.json.example`](./packages/cursor-security-mcp/mcp.json.example)):

```json
{
  "mcpServers": {
    "cursor-security": {
      "command": "node",
      "args": ["/ABSOLUTE/PATH/TO/cursor-security/packages/cursor-security-mcp/dist/index.js"]
    }
  }
}
```

Full tool list and architecture: [`packages/cursor-security-mcp/README.md`](./packages/cursor-security-mcp/README.md).

---

## Table of contents

1. [Why this exists](#why-this-exists)
2. [Who this is for](#who-this-is-for)
3. [Security MCP for Cursor](#security-mcp-for-cursor)
4. [Repository structure](#repository-structure)
5. [Quick start](#quick-start)
6. [Product surface (routes)](#product-surface-routes)
7. [Wiki — Agentic AI Security](#wiki--agentic-ai-security)
   - [Core argument](#core-argument)
   - [Ten principles (deep)](#ten-principles-deep)
   - [Threat catalog](#threat-catalog)
   - [Minimum controls](#minimum-controls)
   - [Application threat model (this repo)](#application-threat-model-this-repo)
   - [Auth & channel architecture](#auth--channel-architecture)
   - [Library map (`masterfabric-next-sec`)](#library-map-masterfabric-next-sec)
   - [Compliance / ISMS map](#compliance--isms-map)
   - [Framework mapping](#framework-mapping)
   - [Learning paths](#learning-paths)
8. [Scripts](#scripts)
9. [Environment variables](#environment-variables)
10. [Brand & naming](#brand--naming)
11. [Sources & further reading](#sources--further-reading)
12. [Author](#author)
13. [Contributing / reuse](#contributing--reuse)
14. [Disclaimer](#disclaimer)

---

## Why this exists

Most AI security conversation still centers on the **model prompt**: jailbreaks, system-prompt hardening, output filters. That matters — but it is incomplete.

**Agentic systems** plan, call tools, write code, open pull requests, move data, spend tokens, and trigger side effects across your estate. Once a model can *act*, you are no longer shipping a chatbot. You are shipping **production software with real blast radius**.

| Old framing | Agentic framing |
| --- | --- |
| “Did the model answer safely?” | “Did the agent take an authorized action?” |
| Prompt policy as the main control | Code, gateway, and runtime policy as enforcement |
| Risk ≈ harmful text | Risk ≈ unauthorized write, secret leak, confused deputy, cost runaway |
| One chat session | Identity, tools, memory, approvals, audit, kill switch |

**Cursor Security** is an open teaching + reference monorepo that turns those arguments into:

- a public [manifest](./MANIFEST.md) and guidance site
- a working Next.js control surface (`/login` → `/app`)
- a reusable library: [`masterfabric-next-sec`](./packages/masterfabric-next-sec)
- a Cursor **[Security MCP](#security-mcp-for-cursor)** for multi-domain repo audits: [`@cursor-security/mcp`](./packages/cursor-security-mcp)
- an [ISMS pack](./compliance/README.md) mapped to [SOC 2](https://www.aicpa-cima.com/topic/audit-assurance/audit-and-assurance-greater-than-soc-2), [ISO 27001](https://www.iso.org/standard/27001), and [OWASP ASVS L2](https://owasp.org/www-project-application-security-verification-standard/)

Fork it for education, internal playbooks, product hardening, or auditor walkthroughs.

---

## Who this is for

| Audience | How to use this repo |
| --- | --- |
| Engineers building agents / MCP tools | Steal the principles + wire AuthZ outside the prompt; run [`@cursor-security/mcp`](./packages/cursor-security-mcp) in Cursor |
| Security / AppSec | Map ASVS rows in [`control-matrix.md`](./compliance/control-matrix.md) to real code |
| Founders / Cursor Ambassadors | Public narrative + brand-correct “Developed with Cursor” surface |
| Compliance / GRC | Start at [`compliance/README.md`](./compliance/README.md) → scope → matrix → evidence |
| Students / bootcamps | Follow the [learning paths](#learning-paths) and run the demo app |

---

## Repository structure

```text
cursor-security/
├── apps/web/                         # Next.js product (marketing + /app)
│   ├── src/app/                      # Routes: /, /security, /privacy, /login, /app
│   ├── src/components/               # SiteHeader, SiteFooter, CursorMark, forms
│   ├── public/brand/cursor/          # Official Cursor SVG marks
│   └── public/MANIFEST.md            # Served at /MANIFEST.md
├── packages/masterfabric-next-sec/   # Auth.js + Zod + CSP + rate-limit + audit
├── packages/cursor-security-mcp/     # Cursor MCP: multi-domain repo security audits
├── compliance/                       # ISMS: policies, SoA, matrix, evidence
├── MANIFEST.md                       # Public agentic AI security manifesto
├── docker-compose.yml                # Local Postgres 16
└── .github/workflows/ci.yml          # Install, build, typecheck, lint, audit
```

| Path | Role | Deep dive |
| --- | --- | --- |
| [`apps/web`](./apps/web) | Product UI + Server Actions + Auth.js wiring | [Product surface](#product-surface-routes) |
| [`packages/masterfabric-next-sec`](./packages/masterfabric-next-sec) | Reusable security primitives | [Library map](#library-map-masterfabric-next-sec) |
| [`packages/cursor-security-mcp`](./packages/cursor-security-mcp) | MCP server for repo security scoring in Cursor | [Security MCP](#security-mcp-for-cursor) |
| [`compliance/`](./compliance/) | Management system + auditor spine | [Compliance map](#compliance--isms-map) |
| [`MANIFEST.md`](./MANIFEST.md) | Ten principles + threats + minimum controls | [Wiki](#wiki--agentic-ai-security) |
| [`apps/web/public/brand/cursor/`](./apps/web/public/brand/cursor/) | Official logos from Ambassador Studio | [Brand](#brand--naming) |

<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/gurkanfikretgunak/cursor-security/main/apps/web/public/brand/cursor/cube-2d-dark.svg" />
    <img src="https://raw.githubusercontent.com/gurkanfikretgunak/cursor-security/main/apps/web/public/brand/cursor/cube-2d-light.svg" alt="Cursor cube" width="56" />
  </picture>
</p>

---

## Quick start

**Prerequisites**

- [Node.js](https://nodejs.org/) 20+
- [Docker](https://docs.docker.com/get-docker/) (for local Postgres) or any [Postgres](https://www.postgresql.org/) 16+
- Optional: SMTP for real magic-link email (without it, links print to the server console in development)

```bash
# 1) Install workspaces
npm install

# 2) Start Postgres (DB name: cursor_security)
docker compose up -d

# 3) Env
cp apps/web/.env.example apps/web/.env.local
# Generate secret: openssl rand -base64 32  → set AUTH_SECRET=

# 4) Build the security package (workspace dependency)
npm run build -w masterfabric-next-sec

# 5) Migrate
npm run db:migrate

# 6) Dev server
npm run dev
```

Open **[http://localhost:3000](http://localhost:3000)**.

If you renamed the DB from an older `aegis` volume, recreate: `docker compose down -v && docker compose up -d`.

---

## Product surface (routes)

| Route | What it teaches / does | Code |
| --- | --- | --- |
| [`/`](./apps/web/src/app/page.tsx) | Public manifesto landing: principles + threats | [`page.tsx`](./apps/web/src/app/page.tsx) |
| [`/security`](./apps/web/src/app/security/page.tsx) | Trust center: controls + subprocessors | [`security/page.tsx`](./apps/web/src/app/security/page.tsx) |
| [`/security/vulnerability-disclosure`](./apps/web/src/app/security/vulnerability-disclosure/page.tsx) | Responsible disclosure stub | [vuln page](./apps/web/src/app/security/vulnerability-disclosure/page.tsx) |
| [`/privacy`](./apps/web/src/app/privacy/page.tsx) | Starter privacy notice | [`privacy/page.tsx`](./apps/web/src/app/privacy/page.tsx) |
| [`/MANIFEST.md`](./MANIFEST.md) | Raw markdown manifesto (also in repo root) | [`MANIFEST.md`](./MANIFEST.md) |
| [`/login`](./apps/web/src/app/login/page.tsx) | Magic link + auth handshake UI | [`login/page.tsx`](./apps/web/src/app/login/page.tsx) |
| [`/app`](./apps/web/src/app/app/page.tsx) | Authenticated “X-ray” / report / org / audit | [`app/page.tsx`](./apps/web/src/app/app/page.tsx) |
| `/app/org/[orgId]/audit` | Org audit trail (RBAC) | [`audit/page.tsx`](./apps/web/src/app/app/org/[orgId]/audit/page.tsx) |

Footer on public pages: **Author** + **Developed with Cursor** (official cube mark) — see [`site-footer.tsx`](./apps/web/src/components/site-footer.tsx).

---

## Wiki — Agentic AI Security

A dense, link-rich knowledge base. Treat this README as the index; treat [`MANIFEST.md`](./MANIFEST.md) + [`compliance/`](./compliance/) as the syllabus.

### Core argument

1. **Chatbots answer. Agents act.** Tool use, code execution, and connectors turn text into side effects. See [OWASP LLM Top 10 — Excessive Agency](https://owasp.org/www-project-top-10-for-large-language-model-applications/).
2. **The prompt is not your control plane.** Natural language can be ignored, injected, or socially engineered. Enforce authorization in code and gateways ([ASVS V4 Access Control](https://owasp.org/www-project-application-security-verification-standard/)).
3. **Identity before capability.** Every run needs a principal, credentials, and an auditable session — no anonymous production tool use ([NIST AI RMF — Govern / Map](https://www.nist.gov/itl/ai-risk-management-framework)).
4. **Tool trust is zero by default.** MCP servers, plugins, and browsers are supply chain. Pin, review, isolate ([Model Context Protocol](https://modelcontextprotocol.io/)).
5. **Containment beats perfection.** Assume one run can be compromised; design so it cannot take down the estate (sandbox, egress allowlist, budgets, kill switch).
6. **Compliance language already maps.** ASVS (how the app is built), SOC 2 (how you operate trust), ISO 27001 (how you manage the system) describe the same disciplines with different paperwork. Our map: [`control-matrix.md`](./compliance/control-matrix.md).

### Ten principles (deep)

Full prose: [`MANIFEST.md`](./MANIFEST.md). UI summary: [`apps/web/src/app/page.tsx`](./apps/web/src/app/page.tsx).

| # | Principle | Argument | What “good” looks like | Related reading |
| --- | --- | --- | --- | --- |
| 01 | **Least agency** | Every extra tool is attack surface | Read > write; draft > commit; approval > auto | [OWASP LLM — Excessive Agency](https://owasp.org/www-project-top-10-for-large-language-model-applications/) |
| 02 | **Identity before action** | You cannot audit or revoke what has no owner | Named user/service + session + credentials per run | [ASVS V2 / V3](https://owasp.org/www-project-application-security-verification-standard/), [`auth/`](./packages/masterfabric-next-sec/src/auth/) |
| 03 | **Tool trust = zero default** | Connectors are untrusted code with your privileges | Review MCP/plugins; pin versions; isolate net/FS | [MCP](https://modelcontextprotocol.io/), [Confused deputy](https://en.wikipedia.org/wiki/Confused_deputy_problem) |
| 04 | **Prompt ≠ policy** | LLMs do not enforce authorization | AuthZ in Server Actions / gateways / policy engines | [ASVS V4](https://owasp.org/www-project-application-security-verification-standard/), [`requireUser`](./packages/masterfabric-next-sec/src/auth/require.ts) |
| 05 | **Human control for high impact** | Irreversible actions need a human in the loop | Confirm destructive, external, financial, privacy acts | NIST AI RMF Measure/Manage; dual control patterns |
| 06 | **Observable by design** | You cannot investigate what you did not log | Plans, tool calls, approvals, denials, outcomes | [ASVS V7](https://owasp.org/www-project-application-security-verification-standard/), [`audit/`](./packages/masterfabric-next-sec/src/audit/) |
| 07 | **Memory is sensitive data** | Embeddings and long-term memory are confidential stores | Retention, redaction, ACL, tenant isolation | [OWASP LLM — Sensitive Information Disclosure](https://owasp.org/www-project-top-10-for-large-language-model-applications/) |
| 08 | **Contain blast radius** | Compromise of one run must not become estate failure | Sandbox, egress allowlist, rate limits, budgets, kill switch | [`rate-limit/`](./packages/masterfabric-next-sec/src/rate-limit/), network isolation patterns |
| 09 | **Evaluate adversarially** | Agents attract injection and goal hijacking | Continuous tests: injection, tool abuse, exfil | [Prompt injection](https://genai.owasp.org/llmrisk/llm01-prompt-injection/), red-team loops |
| 10 | **Ship with ownership** | Orphan agents never get patched or retired | Named owner, incident path, kill/retire plan | [`policies/incident-response.md`](./compliance/policies/incident-response.md) |

### Threat catalog

| Threat | Description | Agent-specific angle | Mitigations in spirit / in this repo |
| --- | --- | --- | --- |
| Prompt / indirect injection | Attacker-controlled content rewrites goals | Docs, tickets, web pages become instructions | Treat retrieved content as untrusted; separate “data” from “commands”; human approval for high impact — [LLM01](https://genai.owasp.org/llmrisk/llm01-prompt-injection/) |
| Over-privileged tools | Agent has more power than the job needs | One write tool + injection = damage | Least agency; per-tool AuthZ; [`requireOrgRole`](./packages/masterfabric-next-sec) |
| Confused deputy | Agent uses *your* authority for attacker goals | Classic OS problem, now with LLMs | [Confused deputy](https://en.wikipedia.org/wiki/Confused_deputy_problem); never pass ambient admin creds into tools |
| Secret leakage | Tokens/PII leave via logs, traces, or model output | Agents love to echo context | Vault secrets; redact logs; never put secrets in prompts by default — [`.gitignore` env rules](./.gitignore) |
| Unbounded loops / cost | Agent recurses until money or systems break | Tool-calling loops | Budgets, timeouts, rate limits — [`rate-limit/`](./packages/masterfabric-next-sec/src/rate-limit/) |
| Supply chain | Bad model, tool, or package | MCP servers + npm + models | Lockfile, CI `npm audit`, pin tool versions — [`.github/workflows/ci.yml`](./.github/workflows/ci.yml) |
| Cross-tenant bleed | Shared platforms leak context | Multi-tenant agent clouds | Org RBAC, channel bind, tenant-scoped memory — org APIs in [`apps/web`](./apps/web) |
| Session / account takeover | Stolen cookie or magic-link spam | Same as web apps, higher impact if agent-linked | HttpOnly cookies, timeouts, auth rate limit — [threat model T1/T3](./compliance/threat-model.md) |

### Minimum controls

From [`MANIFEST.md`](./MANIFEST.md) — the floor before production agents:

| Control | Expectation | See also |
| --- | --- | --- |
| AuthN / AuthZ | Strong identity; **per-tool** authorization | [`auth/`](./packages/masterfabric-next-sec/src/auth/), [ASVS V2/V4](https://owasp.org/www-project-application-security-verification-standard/) |
| Sandbox | Isolated execution for code/shell tools | OS/container isolation; never raw host shell for untrusted goals |
| Network | Allowlisted egress only | Egress proxies; deny-by-default |
| Secrets | Vaulted; never in prompts by default | [`.env.example`](./apps/web/.env.example), secret managers |
| Approvals | Required for high-impact actions | Human-in-the-loop UX; dual control |
| Audit | Immutable trail of decisions + tool use | [`audit/`](./packages/masterfabric-next-sec/src/audit/), [`logging.md`](./compliance/policies/logging.md) |
| Kill switch | Immediate revoke + halt | Token revoke, disable agent, page on-call |

### Application threat model (this repo)

Source of truth: [`compliance/threat-model.md`](./compliance/threat-model.md).

**Assets:** user email/identity, session tokens, org membership/roles, audit logs, `AUTH_SECRET` / DB credentials, public manifesto.

**Trust boundaries:** Browser (untrusted) → Server (AuthZ) → Postgres; Server → SMTP; CI/devs → production secrets.

| ID | Abuse case | Mitigation in code / policy |
| --- | --- | --- |
| T1 | Session theft → account takeover | HttpOnly Secure cookies, short maxAge, HSTS — [`auth/config.ts`](./packages/masterfabric-next-sec/src/auth/config.ts) |
| T2 | IDOR across orgs | `requireOrgRole` / `assertOrgMember` on org actions |
| T3 | Magic-link spam / stuffing | Rate limit preset `auth` |
| T4 | XSS → session abuse | CSP + React escaping — [`headers/`](./packages/masterfabric-next-sec/src/headers/), [`next.config.ts`](./apps/web/next.config.ts) |
| T5 | Client-side privilege escalation | RBAC **only** on server |
| T6 | Audit tampering | Append-oriented inserts; no public update/delete |
| T7 | Secret leakage to client bundle | No `NEXT_PUBLIC_` secrets; server-only DB/auth |
| T8 | Dependency compromise | Lockfile + CI `npm audit` |

Happy path (short): magic link request (rate limited) → Auth.js verification → DB session cookie → `/app/*` middleware → Server Actions with `requireUser` + Zod + org RBAC + audit write.

### Auth & channel architecture

Educational pattern implemented in this monorepo (not a claim of formal certification):

```text
Browser
  │  POST /api/auth/handshake
  ▼
Barrier cookie + device JWT + pre-auth channel (/api/c/<id>/preflight)
  │  magic link (handshakeId must match barrier)
  ▼
Auth.js session (Postgres)
  │  POST /api/auth/bind
  ▼
Blended JWT (user + device + barrier fingerprint)
  + private channel /api/c/<id>/me
  │
  ▼
verifyChannelAccess — wrong path / device / blend → deny + audit
```

| Step | Endpoint / API | Purpose |
| --- | --- | --- |
| Handshake | [`POST /api/auth/handshake`](./apps/web/src/app/api/auth/handshake/route.ts) | Device identity before login |
| Magic link | [`auth.ts`](./apps/web/src/auth.ts) + [`actions/auth.ts`](./apps/web/src/app/actions/auth.ts) | Passwordless sign-in |
| Bind | [`POST /api/auth/bind`](./apps/web/src/app/api/auth/bind/route.ts) | Blend user ↔ device after login |
| Channel | [`/api/c/[channel]/...`](./apps/web/src/app/api/c/[channel]/me/route.ts) | Path-bound private API |
| Library helpers | [`createAuthHandshake`](./packages/masterfabric-next-sec/src/auth/handshake.ts), `issueDeviceJwt`, `issueBlendedJwt`, `verifyChannelAccess` | Reusable primitives |

Session defaults (override via options): **8h** absolute max age, **1h** sliding update — see [package README](./packages/masterfabric-next-sec/README.md#session-timeouts-access-control).

### Library map (`masterfabric-next-sec`)

Docs: [`packages/masterfabric-next-sec/README.md`](./packages/masterfabric-next-sec/README.md).

| Import | Responsibility | ASVS-ish area |
| --- | --- | --- |
| `masterfabric-next-sec/auth` | `requireUser`, `requireRole`, `createAuthConfig`, handshake/JWT/channel | V2 / V3 / V4 |
| `masterfabric-next-sec/headers` | CSP + security headers (+ HSTS in prod) | V14.4 |
| `masterfabric-next-sec/validate` | Zod `actionHandler` / `apiHandler` | V5 |
| `masterfabric-next-sec/audit` | Typed audit event writer | V7 |
| `masterfabric-next-sec/rate-limit` | Memory store + `auth` / `sensitive` presets | V11 |
| `masterfabric-next-sec/errors` | `AppError`, safe client mapping | V7.4 |

Wire-up order (≈15 minutes): headers → Auth.js config → Zod actions → audit writer → rate limiter — step-by-step in the [package README](./packages/masterfabric-next-sec/README.md#quick-wire-up-15-minutes).

### Compliance / ISMS map

Index: [`compliance/README.md`](./compliance/README.md).

**Auditor navigation (recommended order)**

1. [`scope.md`](./compliance/scope.md) — what is in / out
2. [`threat-model.md`](./compliance/threat-model.md) + [`risk-register.md`](./compliance/risk-register.md)
3. [`control-matrix.md`](./compliance/control-matrix.md) — **ISO Annex A ↔ SOC 2 TSC ↔ ASVS ↔ code**
4. Sample [`policies/`](./compliance/policies/) and [`evidence/`](./compliance/evidence/)
5. Confirm implementation in linked source paths
6. [`soa.md`](./compliance/soa.md) — Statement of Applicability

| Artifact | Path | Purpose |
| --- | --- | --- |
| Scope | [`compliance/scope.md`](./compliance/scope.md) | Product / system boundary |
| Threat model | [`compliance/threat-model.md`](./compliance/threat-model.md) | Assets, actors, abuse cases |
| Risk register | [`compliance/risk-register.md`](./compliance/risk-register.md) | Tracked risks |
| Control matrix | [`compliance/control-matrix.md`](./compliance/control-matrix.md) | Single map to code |
| SoA | [`compliance/soa.md`](./compliance/soa.md) | ISO applicability |
| Information security policy | [`policies/information-security.md`](./compliance/policies/information-security.md) | Top-level IS policy |
| Access control | [`policies/access-control.md`](./compliance/policies/access-control.md) | Who may do what |
| Acceptable use | [`policies/acceptable-use.md`](./compliance/policies/acceptable-use.md) | User obligations |
| SDLC | [`policies/sdlc.md`](./compliance/policies/sdlc.md) | Secure change / CI |
| Logging | [`policies/logging.md`](./compliance/policies/logging.md) | Audit / retention |
| Incident response | [`policies/incident-response.md`](./compliance/policies/incident-response.md) | When things break |
| Vendors | [`policies/vendors.md`](./compliance/policies/vendors.md) | Subprocessors |
| Crypto / secrets | [`policies/crypto-secrets.md`](./compliance/policies/crypto-secrets.md) | Key & secret handling |
| Backup / BC | [`policies/backup-bc.md`](./compliance/policies/backup-bc.md) | Continuity |
| HR / training | [`policies/hr-training.md`](./compliance/policies/hr-training.md) | People controls |
| Access reviews evidence | [`evidence/access-reviews.md`](./compliance/evidence/access-reviews.md) | Quarterly ritual |
| Joiner / leaver | [`evidence/joiner-leaver.md`](./compliance/evidence/joiner-leaver.md) | Lifecycle |
| Backup restore drill | [`evidence/backup-restore-drill.md`](./compliance/evidence/backup-restore-drill.md) | Annual drill |

**Certification path (operating, not a promise):** observation → SOC 2 Type I → Type II (≥3 months evidence) → ISO Stage 1/2 → surveillance. Details in [`compliance/README.md`](./compliance/README.md).

### Framework mapping

| Framework | Official link | How we use it here |
| --- | --- | --- |
| OWASP ASVS L2 | https://owasp.org/www-project-application-security-verification-standard/ | Technical bar for auth, sessions, validation, headers, logging |
| OWASP Top 10 for LLM Apps | https://owasp.org/www-project-top-10-for-large-language-model-applications/ | Agent/LLM risk vocabulary (injection, excessive agency, SSRF via tools) |
| OWASP Prompt Injection | https://genai.owasp.org/llmrisk/llm01-prompt-injection/ | Threat narrative for principle 09 |
| AICPA SOC 2 | https://www.aicpa-cima.com/topic/audit-assurance/audit-and-assurance-greater-than-soc-2 | Trust services narrative + evidence cadence |
| ISO/IEC 27001 | https://www.iso.org/standard/27001 | ISMS spine: scope, SoA, policies, risk |
| NIST AI RMF | https://www.nist.gov/itl/ai-risk-management-framework | Govern / Map / Measure / Manage language |
| NIST SSDF (SP 800-218) | https://csrc.nist.gov/pubs/sp/800/218/final | Secure software development framing for SDLC policy |
| Model Context Protocol | https://modelcontextprotocol.io/ | Tool/connector trust boundary |
| Confused deputy | https://en.wikipedia.org/wiki/Confused_deputy_problem | Classic pattern behind over-privileged agents |
| Auth.js | https://authjs.dev | Session/auth implementation |
| Next.js App Router | https://nextjs.org/docs | Product framework |
| Drizzle ORM | https://orm.drizzle.team | Schema + migrations |
| Cursor brand | https://cursor.com/brand | Logo + naming rules |
| Ambassador asset library | https://kamilstanuch.github.io/cursor-ambassador-studio/#/library | Official SVG downloads used under `public/brand/cursor/` |

### Learning paths

**Path A — Engineer (half day)**  
1. Read [Core argument](#core-argument) + [Ten principles](#ten-principles-deep)  
2. Read [`MANIFEST.md`](./MANIFEST.md)  
3. [Quick start](#quick-start) → browse `/`, `/security`, `/login`, `/app`  
4. Trace one Server Action: Zod → `requireUser` → audit  
5. Skim [package README wire-up](./packages/masterfabric-next-sec/README.md#quick-wire-up-15-minutes)  
6. Fork CSP or rate-limit into your own app  

**Path B — AppSec / GRC (one day)**  
1. [`compliance/README.md`](./compliance/README.md) navigation order  
2. [`threat-model.md`](./compliance/threat-model.md) + [`risk-register.md`](./compliance/risk-register.md)  
3. Pick 10 rows in [`control-matrix.md`](./compliance/control-matrix.md) and open the linked files  
4. Sample two policies + one evidence template  
5. Draft what you would still need for Type II observation in *your* org  

**Path C — Ambassador / educator (2 hours)**  
1. Landing + footer brand marks  
2. Explain the five-row “old vs agentic framing” table live  
3. Point students at Manifest + Sources  
4. Demo magic-link login and audit timeline  

---

## Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Next.js dev server (`@cursor-security/web`) |
| `npm run build` | Build `masterfabric-next-sec` + MCP + web |
| `npm run typecheck` | Typecheck packages + web |
| `npm run mcp` | Start `@cursor-security/mcp` (stdio) |
| `npm run lint` | ESLint web |
| `npm run db:generate` | Drizzle generate |
| `npm run db:migrate` | Apply migrations |
| `npm run db:studio` | Drizzle Studio |

CI: [`.github/workflows/ci.yml`](./.github/workflows/ci.yml) — install, build package, typecheck, lint, build web, `npm audit`.

---

## Environment variables

Template: [`apps/web/.env.example`](./apps/web/.env.example) (`.env*` is gitignored except the example).

| Variable | Purpose |
| --- | --- |
| `DATABASE_URL` | Postgres connection (default DB name `cursor_security`) |
| `AUTH_SECRET` | Auth.js secret (`openssl rand -base64 32`) |
| `AUTH_URL` | Public app URL (e.g. `http://localhost:3000`) |
| `AUTH_EMAIL_FROM` | Magic-link From identity |
| `SMTP_HOST` / `SMTP_PORT` / `SMTP_USER` / `SMTP_PASSWORD` | Optional production mail |

---

## Brand & naming

- Product name in this repo: **Cursor Security**
- Company/product short name: **Cursor** — not “Cursor AI” or “Cursor Code” ([brand guidelines](https://cursor.com/brand))
- Official SVGs from [Ambassador Studio library](https://kamilstanuch.github.io/cursor-ambassador-studio/#/library) → [`apps/web/public/brand/cursor/`](./apps/web/public/brand/cursor/)
- README logos use **absolute** `raw.githubusercontent.com` URLs + `<picture>` / `prefers-color-scheme` (GitHub-safe inline `fill`, no CSS classes)
- Brand colors: light fg `#26251e` / dark fg `#edecec` ([brand tokens](https://github.com/kamilstanuch/cursor-ambassador-studio/blob/main/js/brandTokens.js))
- Product UI (light page): cube mark in header/hero; footer **Developed with Cursor** → https://cursor.com
- Full asset table: [`apps/web/public/brand/cursor/README.md`](./apps/web/public/brand/cursor/README.md)

| File | Theme | Role |
| --- | --- | --- |
| `lockup-horizontal-2d-light.svg` / `…-dark.svg` | Light / Dark | Hero lockup in README |
| `cube-2d-light.svg` / `cube-2d-dark.svg` | Light / Dark | Compact mark (README + UI light) |
| `cube-25d.svg` | Both | Shaded cube (UI hero) |
| `wordmark-light.svg` / `wordmark-dark.svg` | Light / Dark | Wordmark only |

---

## Sources & further reading

### In this repository (click through)

| Resource | Link |
| --- | --- |
| Manifest | [`MANIFEST.md`](./MANIFEST.md) |
| ISMS index | [`compliance/README.md`](./compliance/README.md) |
| Scope | [`compliance/scope.md`](./compliance/scope.md) |
| Threat model | [`compliance/threat-model.md`](./compliance/threat-model.md) |
| Risk register | [`compliance/risk-register.md`](./compliance/risk-register.md) |
| Control matrix | [`compliance/control-matrix.md`](./compliance/control-matrix.md) |
| SoA | [`compliance/soa.md`](./compliance/soa.md) |
| Policies folder | [`compliance/policies/`](./compliance/policies/) |
| Evidence folder | [`compliance/evidence/`](./compliance/evidence/) |
| Security library | [`packages/masterfabric-next-sec/README.md`](./packages/masterfabric-next-sec/README.md) |
| Web app entry | [`apps/web/src/app/page.tsx`](./apps/web/src/app/page.tsx) |
| Trust center page | [`apps/web/src/app/security/page.tsx`](./apps/web/src/app/security/page.tsx) |
| CI workflow | [`.github/workflows/ci.yml`](./.github/workflows/ci.yml) |
| Docker Postgres | [`docker-compose.yml`](./docker-compose.yml) |

### External standards & papers

| Topic | URL |
| --- | --- |
| OWASP ASVS | https://owasp.org/www-project-application-security-verification-standard/ |
| OWASP Top 10 for LLM Applications | https://owasp.org/www-project-top-10-for-large-language-model-applications/ |
| OWASP GenAI / Prompt Injection (LLM01) | https://genai.owasp.org/llmrisk/llm01-prompt-injection/ |
| NIST AI RMF | https://www.nist.gov/itl/ai-risk-management-framework |
| NIST SSDF SP 800-218 | https://csrc.nist.gov/pubs/sp/800/218/final |
| ISO/IEC 27001 | https://www.iso.org/standard/27001 |
| AICPA SOC 2 | https://www.aicpa-cima.com/topic/audit-assurance/audit-and-assurance-greater-than-soc-2 |
| Confused deputy problem | https://en.wikipedia.org/wiki/Confused_deputy_problem |
| Model Context Protocol | https://modelcontextprotocol.io/ |
| Auth.js documentation | https://authjs.dev |
| Next.js documentation | https://nextjs.org/docs |
| Drizzle ORM | https://orm.drizzle.team |
| Postgres documentation | https://www.postgresql.org/docs/ |
| Zod | https://zod.dev |

### Cursor & community

| Topic | URL |
| --- | --- |
| Cursor | https://cursor.com |
| Cursor brand | https://cursor.com/brand |
| Ambassador Studio (assets) | https://kamilstanuch.github.io/cursor-ambassador-studio/#/library |
| Ambassador Studio source | https://github.com/kamilstanuch/cursor-ambassador-studio |
| This repository | https://github.com/gurkanfikretgunak/cursor-security |

---

## Author

| | |
| --- | --- |
| Name | [Gürkan Fikret Günak](https://github.com/gurkanfikretgunak) |
| Role | Cursor Ambassador · AI / Mobile Team Lead |
| GitHub | https://github.com/gurkanfikretgunak |
| Website | https://gurkanfikretgunak.com |
| Twitter / X | https://twitter.com/gurkandev |
| Linktree | https://linktr.ee/gurkanfikretgunak |
| LinkedIn | https://linkedin.com/in/gurkanfikretgunak |
| Repository | https://github.com/gurkanfikretgunak/cursor-security |

---

## Contributing / reuse

- Fork for education, internal playbooks, and product hardening.
- Keep attribution to this repo when you republish substantial text from the wiki/manifest.
- When redistributing Cursor logos, follow [cursor.com/brand](https://cursor.com/brand) and keep the vendored files’ provenance ([brand README](./apps/web/public/brand/cursor/README.md)).
- When you adapt controls, update **your** threat model and evidence — do not claim certification from this pack alone.
- Issues and PRs welcome on https://github.com/gurkanfikretgunak/cursor-security

---

## Disclaimer

This repository provides **educational patterns, mapped controls, and starter policies**. It does **not** replace:

- a CPA firm for SOC 2 attestation  
- an accredited certification body for ISO 27001  
- counsel-reviewed privacy / security legal language  
- a full agent runtime sandbox product (narrative + app controls only where implemented)

Capability should grow only as fast as verification, observability, and human accountability — see the commitment in [`MANIFEST.md`](./MANIFEST.md).

---

<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/gurkanfikretgunak/cursor-security/main/apps/web/public/brand/cursor/cube-2d-dark.svg" />
    <img src="https://raw.githubusercontent.com/gurkanfikretgunak/cursor-security/main/apps/web/public/brand/cursor/cube-2d-light.svg" alt="Cursor" width="32" />
  </picture>
  <br/>
  <sub>
    Developed with <a href="https://cursor.com">Cursor</a>
    · Author <a href="https://github.com/gurkanfikretgunak">Gürkan Fikret Günak</a>
    · Cursor Ambassador
    · <a href="https://github.com/gurkanfikretgunak/cursor-security">cursor-security</a>
  </sub>
</p>
