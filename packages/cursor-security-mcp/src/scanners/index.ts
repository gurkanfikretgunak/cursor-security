import type { Finding, SecurityDomain, SecurityReport } from "../types.js";
import { buildReport } from "../report.js";
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

export async function runDomainScan(
  domain: SecurityDomain | "full",
  projectPathInput?: string
): Promise<SecurityReport> {
  const projectPath = await resolveProjectPath(projectPathInput);
  const files = (await walkSourceFiles(projectPath)).filter(
    (f) => !isScannerImplementationFile(f.relativePath)
  );

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
    findings.push(...(await scanDependencies(projectPath, files)));
  }
  if (runAll || domain === "config") {
    findings.push(...(await scanConfig(projectPath, files)));
  }
  if (runAll || domain === "project") {
    findings.push(...(await scanProject(projectPath, files)));
  }

  return buildReport(projectPath, findings);
}
