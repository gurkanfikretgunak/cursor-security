#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { runDomainScan } from "./scanners/index.js";
import { SECURITY_SERVICES, formatReportMarkdown } from "./report.js";
import type { SecurityDomain } from "./types.js";

const server = new McpServer({
  name: "cursor-security",
  version: "1.0.0",
});

const pathSchema = z
  .string()
  .optional()
  .describe("Absolute or relative path to the project root. Defaults to process cwd.");

function textResult(payload: unknown) {
  const text =
    typeof payload === "string" ? payload : JSON.stringify(payload, null, 2);
  return {
    content: [{ type: "text" as const, text }],
  };
}

server.tool(
  "security_services_status",
  "List all security scanner services exposed by this MCP and their readiness.",
  {},
  async () =>
    textResult({
      server: "cursor-security",
      version: "1.0.0",
      purpose:
        "Audit a project repository for security posture across client, backend, secrets, dependencies, and configuration.",
      services: SECURITY_SERVICES,
    })
);

server.tool(
  "security_list_checks",
  "Describe available security domains and what each scanner covers.",
  {},
  async () =>
    textResult({
      domains: SECURITY_SERVICES.map((s) => ({
        id: s.id,
        name: s.name,
        description: s.description,
        checks: s.checks,
      })),
      tools: [
        "security_scan_full",
        "security_scan_secrets",
        "security_scan_client",
        "security_scan_backend",
        "security_scan_dependencies",
        "security_scan_config",
        "security_score",
        "security_services_status",
        "security_list_checks",
      ],
    })
);

async function scanTool(domain: SecurityDomain | "full", projectPath?: string) {
  const report = await runDomainScan(domain, projectPath);
  return textResult({
    markdown: formatReportMarkdown(report),
    report,
  });
}

server.tool(
  "security_scan_full",
  "Run a full multi-domain security audit (secrets, client, backend, dependencies, config, project hygiene) and return score + findings.",
  { projectPath: pathSchema },
  async ({ projectPath }) => scanTool("full", projectPath)
);

server.tool(
  "security_scan_secrets",
  "Scan for hardcoded secrets, tokens, private keys, and committed environment files.",
  { projectPath: pathSchema },
  async ({ projectPath }) => scanTool("secrets", projectPath)
);

server.tool(
  "security_scan_client",
  "Scan client-side code for XSS sinks, insecure token storage, missing CSP signals, and related browser risks.",
  { projectPath: pathSchema },
  async ({ projectPath }) => scanTool("client", projectPath)
);

server.tool(
  "security_scan_backend",
  "Scan backend/API code for injection patterns, CORS misconfiguration, auth gaps, cookie flags, and rate-limit signals.",
  { projectPath: pathSchema },
  async ({ projectPath }) => scanTool("backend", projectPath)
);

server.tool(
  "security_scan_dependencies",
  "Audit dependency manifests for lockfiles, risky packages, floating versions, and dangerous install scripts.",
  { projectPath: pathSchema },
  async ({ projectPath }) => scanTool("dependencies", projectPath)
);

server.tool(
  "security_scan_config",
  "Audit repository configuration: gitignore, Docker, CI security jobs, security headers, and npmrc tokens.",
  { projectPath: pathSchema },
  async ({ projectPath }) => scanTool("config", projectPath)
);

server.tool(
  "security_score",
  "Return a compact security scorecard for the project without the full markdown dump.",
  { projectPath: pathSchema },
  async ({ projectPath }) => {
    const report = await runDomainScan("full", projectPath);
    return textResult({
      projectPath: report.projectPath,
      scannedAt: report.scannedAt,
      overallScore: report.overallScore,
      grade: report.grade,
      summary: report.summary,
      domains: report.domains.map((d) => ({
        domain: d.domain,
        label: d.label,
        score: d.score,
        failed: d.failed,
        findingCount: d.findings.length,
      })),
      topFindings: report.findings.slice(0, 10).map((f) => ({
        severity: f.severity,
        title: f.title,
        file: f.file,
        line: f.line,
        recommendation: f.recommendation,
      })),
    });
  }
);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((error) => {
  console.error("cursor-security MCP failed to start:", error);
  process.exit(1);
});
