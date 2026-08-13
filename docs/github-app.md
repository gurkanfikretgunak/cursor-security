# GitHub App integration (scaffold)

This monorepo can attach repository scans to PRs via:

1. **Workflow** [`.github/workflows/security-scan.yml`](../.github/workflows/security-scan.yml) — runs `@cursor-security/mcp` CLI, uploads SARIF, writes a job summary.
2. **Composite action** [`.github/actions/security-scan`](../.github/actions/security-scan/action.yml) — reusable step for other repos that vendor this package.
3. **Ingest API** `POST /api/scans` — authenticated agents/CI can persist JSON reports into Postgres for `/app/scans`.

## Recommended GitHub App shape (next increment)

| Capability | Purpose |
| --- | --- |
| `checks:write` | Publish a Check Run with grade/score |
| `pull_requests:write` | Optional PR comment with top findings |
| `security_events:write` | SARIF upload to code scanning |
| Webhook `pull_request` | Trigger scan on open/sync |

Store the App private key in GitHub Secrets / a vault. Never put it in prompts or MCP tool args.

## Minimal CI comment (without a full App)

```bash
npm run build -w @cursor-security/mcp
node packages/cursor-security-mcp/dist/cli.js --format json --out report.json .
# POST report.json.report to https://<your-host>/api/scans with a session cookie or machine token
```

## Kill switch / least agency

Use `packages/cursor-security-mcp/src/sandbox/policy.ts` (`gateAgentTool`, `createKillSwitch`) in any GitHub App worker so tool-using agents cannot exceed budgets or skip approvals.
