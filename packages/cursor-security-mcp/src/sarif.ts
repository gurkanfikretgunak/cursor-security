import type { Finding, SecurityReport, Severity } from "./types.js";

const LEVEL: Record<Severity, string> = {
  critical: "error",
  high: "error",
  medium: "warning",
  low: "note",
  info: "note",
};

export function toSarif(report: SecurityReport): Record<string, unknown> {
  const rules = new Map<string, Finding>();
  for (const f of report.findings) {
    const key = f.ruleId || f.id.split(":")[0] || f.id;
    if (!rules.has(key)) rules.set(key, f);
  }

  return {
    $schema:
      "https://raw.githubusercontent.com/oasis-tcs/sarif-spec/master/Schemata/sarif-schema-2.1.0.json",
    version: "2.1.0",
    runs: [
      {
        tool: {
          driver: {
            name: "cursor-security-mcp",
            informationUri:
              "https://github.com/gurkanfikretgunak/cursor-security/tree/main/packages/cursor-security-mcp",
            version: "1.0.0",
            rules: [...rules.entries()].map(([id, f]) => ({
              id,
              shortDescription: { text: f.title },
              fullDescription: { text: f.description },
              help: { text: f.recommendation },
              defaultConfiguration: {
                level: LEVEL[f.severity],
              },
              properties: {
                domain: f.domain,
                severity: f.severity,
              },
            })),
          },
        },
        results: report.findings.map((f) => ({
          ruleId: f.ruleId || f.id.split(":")[0] || f.id,
          level: LEVEL[f.severity],
          message: { text: `${f.title}: ${f.description}` },
          // GitHub Code Scanning rejects results with zero locations.
          locations: [
            {
              physicalLocation: {
                artifactLocation: {
                  uri: (f.file || "README.md").replace(/\\/g, "/"),
                },
                region: { startLine: f.line && f.line > 0 ? f.line : 1 },
              },
            },
          ],
          properties: {
            domain: f.domain,
            gradeContribution: f.severity,
            findingId: f.id,
          },
        })),
        properties: {
          overallScore: report.overallScore,
          grade: report.grade,
          scannedAt: report.scannedAt,
          projectPath: report.projectPath,
          suppressedCount: report.suppressedCount ?? 0,
        },
      },
    ],
  };
}
