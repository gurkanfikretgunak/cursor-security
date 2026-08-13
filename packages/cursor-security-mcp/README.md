# `@cursor-security/mcp`

stdio **Model Context Protocol** server + CLI that turns a Cursor coding session (or CI job) into a living security review board.

## Domains (7)

Secrets · Client · Backend · Dependencies (+ optional npm audit) · Config · Project · **Agent / MCP trust**

## Tools (12)

| Tool | Purpose |
| --- | --- |
| `security_services_status` | Scanner readiness |
| `security_list_checks` | Domain catalog |
| `security_scan_full` | Full audit |
| `security_scan_secrets` | Secrets |
| `security_scan_client` | Client / XSS / storage |
| `security_scan_backend` | API / injection / CORS |
| `security_scan_dependencies` | Supply chain (+ `includeOsv`) |
| `security_scan_config` | Docker / CI / headers |
| `security_scan_project` | Hygiene |
| `security_scan_agent` | Auto-approve, shell tools, sandbox |
| `security_score` | Compact A–F scorecard |
| `security_export_sarif` | SARIF 2.1 for code scanning |

## Ignore file

Create `.cursor-securityignore` at the project root:

```gitignore
# path globs
fixtures/**
docs/examples/**

# suppress by finding id or rule id
id:deps-no-audit-script
rule:agent-missing-sandbox
```

## CLI

```bash
npm run build -w @cursor-security/mcp

# Markdown to stdout
node packages/cursor-security-mcp/dist/cli.js .

# SARIF for GitHub
node packages/cursor-security-mcp/dist/cli.js --format sarif --out results.sarif --fail-on high .

# With npm audit signals
node packages/cursor-security-mcp/dist/cli.js --osv --format json .
```

## Cursor MCP config

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

## Persist into the web app

`POST /api/scans` with `{ "report": { ...SecurityReport }, "source": "mcp" }` (authenticated). History UI: `/app/scans`.

## Sandbox helpers

`src/sandbox/policy.ts` — `gateAgentTool`, `createKillSwitch`, `DEFAULT_SANDBOX_POLICY` for agent runtimes / GitHub App workers.

## Tests

```bash
npm run test -w @cursor-security/mcp
```

Scanners are **defensive static audits**. They do not generate exploits or attack payloads.
