import type { Finding, ScanOptions, SecurityDomain, SecurityReport } from "../types.js";
import { buildReport } from "../report.js";
import { filterFindings, isPathIgnored, loadIgnoreRules } from "../ignore.js";
import {
  isScannerImplementationFile,
  resolveProjectPath,
  walkSourceFiles,
} from "../utils/fs.js";
import { scanSecrets } from "./secrets.js";
import { scanClient } from "./client.js";
import { scanBackend } from "./backend.js";
import { scanDependencies } from "./dependencies.js";
import { scanConfig } from "./config.js";
import { scanProject } from "./project.js";
import { scanAgent } from "./agent.js";

export async function runDomainScan(
  domain: SecurityDomain | "full",
  projectPathOrOptions?: string | ScanOptions
): Promise<SecurityReport> {
  const options: ScanOptions =
    typeof projectPathOrOptions === "string" || projectPathOrOptions === undefined
      ? { projectPath: projectPathOrOptions }
      : projectPathOrOptions;

  const projectPath = await resolveProjectPath(options.projectPath);
  const ignore = await loadIgnoreRules(
    projectPath,
    options.ignoreFileName || ".cursor-securityignore"
  );

  const files = (await walkSourceFiles(projectPath)).filter((f) => {
    if (isScannerImplementationFile(f.relativePath)) return false;
    if (isPathIgnored(f.relativePath, ignore)) return false;
    return true;
  });

  const findings: Finding[] = [];
  const runAll = domain === "full";

  if (runAll || domain === "secrets") {
    findings.push(...scanSecrets(files));
  }
  if (runAll || domain === "client") {
    findings.push(...scanClient(files));
  }
  if (runAll || domain === "backend") {
    findings.push(...scanBackend(files));
  }
  if (runAll || domain === "dependencies") {
    findings.push(
      ...(await scanDependencies(projectPath, files, {
        includeOsv: options.includeOsv,
      }))
    );
  }
  if (runAll || domain === "config") {
    findings.push(...(await scanConfig(projectPath, files)));
  }
  if (runAll || domain === "project") {
    findings.push(...(await scanProject(projectPath, files)));
  }
  if (runAll || domain === "agent") {
    findings.push(...scanAgent(files));
  }

  const { kept, suppressed } = filterFindings(findings, ignore);
  return buildReport(projectPath, kept, suppressed);
}
