#!/usr/bin/env node
import { promises as fs } from "node:fs";
import path from "node:path";
import { runDomainScan } from "./scanners/index.js";
import { formatReportMarkdown } from "./report.js";
import { toSarif } from "./sarif.js";
import type { SecurityDomain } from "./types.js";

function usage(): never {
  console.log(`Usage:
  cursor-security-scan [options] [projectPath]

Options:
  --domain <name>   full|secrets|client|backend|dependencies|config|project|agent (default: full)
  --format <name>   markdown|json|sarif (default: markdown)
  --out <file>      write report to file
  --osv             include npm audit / OSV-style dependency signals when available
  --fail-on <sev>   exit 1 if any finding >= severity (critical|high|medium|low|info)
`);
  process.exit(2);
}

const SEV_RANK = { critical: 4, high: 3, medium: 2, low: 1, info: 0 } as const;

async function main() {
  const args = process.argv.slice(2);
  if (args.includes("-h") || args.includes("--help")) usage();

  let domain: SecurityDomain | "full" = "full";
  let format = "markdown";
  let out: string | undefined;
  let includeOsv = false;
  let failOn: keyof typeof SEV_RANK | undefined;
  const positionals: string[] = [];

  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (a === "--domain") domain = args[++i] as SecurityDomain | "full";
    else if (a === "--format") format = String(args[++i] || "markdown");
    else if (a === "--out") out = args[++i];
    else if (a === "--osv") includeOsv = true;
    else if (a === "--fail-on") failOn = args[++i] as keyof typeof SEV_RANK;
    else if (a.startsWith("-")) usage();
    else positionals.push(a);
  }

  const projectPath = positionals[0];
  const report = await runDomainScan(domain, {
    projectPath,
    includeOsv,
  });

  let body: string;
  if (format === "json") body = JSON.stringify(report, null, 2);
  else if (format === "sarif") body = JSON.stringify(toSarif(report), null, 2);
  else body = formatReportMarkdown(report);

  if (out) {
    const target = path.resolve(out);
    const dir = path.dirname(target);
    if (dir && dir !== target) {
      await fs.mkdir(dir, { recursive: true });
    }
    await fs.writeFile(target, body, "utf8");
    console.error(`Wrote ${target}`);
  } else {
    console.log(body);
  }

  if (failOn) {
    const min = SEV_RANK[failOn];
    const hit = report.findings.some((f) => SEV_RANK[f.severity] >= min);
    if (hit) process.exit(1);
  }
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
