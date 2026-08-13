import type {
  DomainResult,
  Finding,
  SecurityDomain,
  SecurityReport,
  ServiceStatus,
  Severity,
} from "./types.js";

const SEVERITY_WEIGHT: Record<Severity, number> = {
  critical: 25,
  high: 15,
  medium: 8,
  low: 3,
  info: 1,
};

const DOMAIN_LABELS: Record<SecurityDomain, string> = {
  secrets: "Secrets & credentials",
  client: "Client-side security",
  backend: "Backend & API security",
  dependencies: "Dependencies & supply chain",
  config: "Config & infrastructure",
  project: "Project hygiene",
  agent: "Agent / MCP trust",
};

export const SECURITY_SERVICES: ServiceStatus[] = [
  {
    id: "secrets",
    name: "Secrets Scanner",
    description: "Detects hardcoded keys, tokens, private key blocks, and committed env files.",
    status: "ready",
    checks: 7,
  },
  {
    id: "client",
    name: "Client Security Scanner",
    description: "Checks XSS sinks, insecure storage, HTTP URLs, and CSP signals.",
    status: "ready",
    checks: 8,
  },
  {
    id: "backend",
    name: "Backend Security Scanner",
    description: "Flags SQLi patterns, CORS misconfig, auth gaps, command injection, cookies.",
    status: "ready",
    checks: 9,
  },
  {
    id: "dependencies",
    name: "Dependency Auditor",
    description: "Reviews manifests, lockfiles, risky packages, npm audit/OSV signals.",
    status: "ready",
    checks: 8,
  },
  {
    id: "config",
    name: "Config & Infra Scanner",
    description: "Audits gitignore, Docker USER, CI security jobs, headers, npmrc tokens.",
    status: "ready",
    checks: 8,
  },
  {
    id: "project",
    name: "Project Hygiene Scanner",
    description: "Checks README/license/tests/engines and TypeScript strictness.",
    status: "ready",
    checks: 5,
  },
  {
    id: "agent",
    name: "Agent / MCP Trust Scanner",
    description: "Least agency signals: auto-approve, shell tools, sandbox, dangerous MCP flags.",
    status: "ready",
    checks: 6,
  },
];

function scoreFromFindings(findings: Finding[]): number {
  const penalty = findings.reduce(
    (sum, f) => sum + (SEVERITY_WEIGHT[f.severity] || 0),
    0
  );
  return Math.max(0, Math.min(100, 100 - penalty));
}

function gradeFromScore(score: number): SecurityReport["grade"] {
  if (score >= 90) return "A";
  if (score >= 75) return "B";
  if (score >= 60) return "C";
  if (score >= 40) return "D";
  return "F";
}

export function buildDomainResult(
  domain: SecurityDomain,
  findings: Finding[]
): DomainResult {
  const domainFindings = findings.filter((f) => f.domain === domain);
  const failed = domainFindings.filter((f) => f.severity !== "info").length;
  const info = domainFindings.filter((f) => f.severity === "info").length;
  return {
    domain,
    label: DOMAIN_LABELS[domain],
    findings: domainFindings,
    score: scoreFromFindings(domainFindings),
    passed: Math.max(0, 10 - failed - Math.min(info, 3)),
    failed,
  };
}

export function buildReport(
  projectPath: string,
  findings: Finding[],
  suppressedCount = 0
): SecurityReport {
  const domains: SecurityDomain[] = [
    "secrets",
    "client",
    "backend",
    "dependencies",
    "config",
    "project",
    "agent",
  ];
  const domainResults = domains.map((d) => buildDomainResult(d, findings));
  const overallScore = Math.round(
    domainResults.reduce((sum, d) => sum + d.score, 0) / domainResults.length
  );
  const grade = gradeFromScore(overallScore);
  const critical = findings.filter((f) => f.severity === "critical").length;
  const high = findings.filter((f) => f.severity === "high").length;

  const summary =
    critical + high === 0
      ? `Security posture looks solid (grade ${grade}). Keep monitoring dependencies and CI scans.`
      : `Found ${critical} critical and ${high} high issues. Prioritize secrets, injection, auth, and agent trust gaps first.`;

  return {
    projectPath,
    scannedAt: new Date().toISOString(),
    overallScore,
    grade,
    summary,
    domains: domainResults,
    findings: [...findings].sort(
      (a, b) => SEVERITY_WEIGHT[b.severity] - SEVERITY_WEIGHT[a.severity]
    ),
    services: SECURITY_SERVICES,
    suppressedCount,
  };
}

export function formatReportMarkdown(report: SecurityReport): string {
  const lines: string[] = [
    `# Security Report`,
    ``,
    `- **Project:** \`${report.projectPath}\``,
    `- **Scanned at:** ${report.scannedAt}`,
    `- **Score:** ${report.overallScore}/100 (grade **${report.grade}**)`,
    `- **Summary:** ${report.summary}`,
  ];
  if (report.suppressedCount) {
    lines.push(`- **Suppressed:** ${report.suppressedCount} finding(s) via ignore rules`);
  }
  lines.push(``, `## Domain scores`, ``);

  for (const domain of report.domains) {
    lines.push(
      `- **${domain.label}:** ${domain.score}/100 — ${domain.failed} issue(s)`
    );
  }

  lines.push(``, `## Findings`, ``);

  if (report.findings.length === 0) {
    lines.push(`No findings. Nice work.`);
  } else {
    for (const f of report.findings.slice(0, 80)) {
      const loc = f.file
        ? ` (\`${f.file}${f.line ? `:${f.line}` : ""}\`)`
        : "";
      lines.push(
        `### [${f.severity.toUpperCase()}] ${f.title}${loc}`,
        ``,
        f.description,
        ``,
        `**Recommendation:** ${f.recommendation}`,
        ``
      );
    }
    if (report.findings.length > 80) {
      lines.push(`_…and ${report.findings.length - 80} more findings._`);
    }
  }

  return lines.join("\n");
}
