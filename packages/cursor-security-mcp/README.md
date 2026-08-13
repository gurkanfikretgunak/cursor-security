# `@cursor-security/mcp`

stdio **Model Context Protocol** server that turns a Cursor coding session into a living security review board.

Point it at any project path and it scores posture across **secrets, client-side, backend/API, dependencies, config/infra, and project hygiene** — then returns actionable findings the agent can fix in the same chat.

## Tools (9)

| Tool | Purpose |
| --- | --- |
| `security_services_status` | List scanner services and readiness |
| `security_list_checks` | Describe domains and tools |
| `security_scan_full` | Full multi-domain audit |
| `security_scan_secrets` | Secrets & credentials |
| `security_scan_client` | Browser / client risks |
| `security_scan_backend` | API / server risks |
| `security_scan_dependencies` | Supply chain / manifests |
| `security_scan_config` | gitignore, Docker, CI, headers |
| `security_score` | Compact scorecard (A–F) |

## Setup

From the monorepo root:

```bash
npm install
npm run build -w @cursor-security/mcp
```

Cursor MCP config (`mcp.json.example`):

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

Then ask: *“Run `security_scan_full` on this workspace.”*

Scanners are **defensive static audits** — they highlight risky patterns and misconfigurations. They do not generate exploits or attack payloads.
