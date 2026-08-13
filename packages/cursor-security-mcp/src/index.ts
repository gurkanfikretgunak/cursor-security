#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { runDomainScan } from "./scanners/index.js";
import { SECURITY_SERVICES, formatReportMarkdown } from "./report.js";
import { toSarif } from "./sarif.js";
import type { SecurityDomain } from "./types.js";

const server = new McpServer({
  name: "cursor-security",
  version: "1.1.0",
});

const pathSchema = z
  .string()
  .optional()
  .describe("Absolute or relative path to the project root. Defaults to process cwd.");

const osvSchema = z
  .boolean()
  .optional()
  .describe("When true, include npm audit vulnerability signals.");

function textResult(payload: unknown) {
  const text =
    typeof payload === "string" ? payload : JSON.stringify(payload, null, 2);
  return {
    content: [{ type: "text" as const, text }],
  };
}

const TOOLS = [
  "security_services_status",
  "security_list_checks",
  "security_scan_full",
  "security_scan_secrets",
  "security_scan_client",
  "security_scan_backend",
  "security_scan_dependencies",
  "security_scan_config",
  "security_scan_project",
  "security_scan_agent",
  "security_score",
  "security_export_sarif",
] as const;

server.tool(
  "security_services_status",
  "List all security scanner services exposed by this MCP and their readiness.",
  {},
  async () =>
    textResult({
      server: "cursor-security",
      version: "1.1.0",
      purpose:
        "Audit a project repository for security posture across client, backend, secrets, dependencies, config, project hygiene, and agent/MCP trust.",
      services: SECURITY_SERVICES,
      ignoreFile: ".cursor-securityignore",
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
      tools: TOOLS,
    })
);

async function scanTool(
  domain: SecurityDomain | "full",
  projectPath?: string,
  includeOsv?: boolean
) {
  const report = await runDomainScan(domain, { projectPath, includeOsv });
  return textResult({
    markdown: formatReportMarkdown(report),
    report,
  });
}

server.tool(
  "security_scan_full",
  "Run a full multi-domain security audit and return score + findings.",
  { projectPath: pathSchema, includeOsv: osvSchema },
  async ({ projectPath, includeOsv }) => scanTool("full", projectPath, includeOsv)
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
  "Audit dependency manifests for lockfiles, risky packages, floating versions, and optional npm audit/OSV signals.",
  { projectPath: pathSchema, includeOsv: osvSchema },
  async ({ projectPath, includeOsv }) =>
    scanTool("dependencies", projectPath, includeOsv)
);

server.tool(
  "security_scan_config",
  "Audit repository configuration: gitignore, Docker, CI security jobs, security headers, and npmrc tokens.",
  { projectPath: pathSchema },
  async ({ projectPath }) => scanTool("config", projectPath)
);

server.tool(
  "security_scan_project",
  "Scan project hygiene: README, license, tests, engines, and TypeScript strictness.",
  { projectPath: pathSchema },
  async ({ projectPath }) => scanTool("project", projectPath)
);

server.tool(
  "security_scan_agent",
  "Scan agentic / MCP trust posture: auto-approve, shell tools, sandbox signals, dangerous flags.",
  { projectPath: pathSchema },
  async ({ projectPath }) => scanTool("agent", projectPath)
);

server.tool(
  "security_score",
  "Return a compact security scorecard for the project without the full markdown dump.",
  { projectPath: pathSchema, includeOsv: osvSchema },
  async ({ projectPath, includeOsv }) => {
    const report = await runDomainScan("full", { projectPath, includeOsv });
    return textResult({
      projectPath: report.projectPath,
      scannedAt: report.scannedAt,
      overallScore: report.overallScore,
      grade: report.grade,
      summary: report.summary,
      suppressedCount: report.suppressedCount,
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

server.tool(
  "security_export_sarif",
  "Run a full scan and return a SARIF 2.1 report suitable for GitHub code scanning uploads.",
  { projectPath: pathSchema, includeOsv: osvSchema },
  async ({ projectPath, includeOsv }) => {
    const report = await runDomainScan("full", { projectPath, includeOsv });
    return textResult(toSarif(report));
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
