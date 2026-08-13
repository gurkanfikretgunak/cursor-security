import path from "node:path";
import type { Finding } from "../types.js";
import { readJsonIfExists, type SourceFile } from "../utils/fs.js";

export async function scanProject(
  projectPath: string,
  files: SourceFile[]
): Promise<Finding[]> {
  const findings: Finding[] = [];

  const readme = files.find((f) => /^readme(\.md|\.txt)?$/i.test(path.basename(f.relativePath)));
  if (!readme) {
    findings.push({
      id: "project-missing-readme",
      domain: "project",
      severity: "info",
      title: "Missing README",
      description: "No README found to document setup and security expectations.",
      recommendation: "Add a README with setup, threat notes, and secret handling guidance.",
    });
  }

  const license = files.find((f) => /^license(\.|$)/i.test(path.basename(f.relativePath)));
  if (!license) {
    findings.push({
      id: "project-missing-license",
      domain: "project",
      severity: "info",
      title: "Missing LICENSE",
      description: "No license file detected.",
      recommendation: "Add an explicit license to clarify usage and contribution terms.",
    });
  }

  const pkg = await readJsonIfExists<{
    engines?: Record<string, string>;
    type?: string;
  }>(path.join(projectPath, "package.json"));

  if (pkg && !pkg.engines?.node) {
    findings.push({
      id: "project-no-engines",
      domain: "project",
      severity: "low",
      title: "package.json missing engines.node",
      description: "Without engines constraints, unsupported runtimes may be used.",
      file: "package.json",
      recommendation: "Declare supported Node versions under engines.",
    });
  }

  const hasTests = files.some((f) =>
    /(^|\/)(__tests__|tests?|spec)(\/|$)|\.(test|spec)\.[jt]sx?$/i.test(f.relativePath)
  );
  if (!hasTests) {
    findings.push({
      id: "project-no-tests",
      domain: "project",
      severity: "medium",
      title: "No automated tests detected",
      description: "Security regressions are harder to catch without tests.",
      recommendation: "Add unit/integration tests for auth, input validation, and sensitive flows.",
    });
  }

  const hasTsconfig = files.some((f) => /tsconfig.*\.json$/i.test(f.relativePath));
  if (hasTsconfig) {
    const tsconfig = files.find((f) => f.relativePath === "tsconfig.json");
    if (tsconfig && /"strict"\s*:\s*false/.test(tsconfig.content)) {
      findings.push({
        id: "project-ts-not-strict",
        domain: "project",
        severity: "low",
        title: "TypeScript strict mode disabled",
        description: "Loose typing can hide nullability and unsafe data handling bugs.",
        file: "tsconfig.json",
        recommendation: "Enable strict TypeScript for safer boundaries.",
      });
    }
  }

  return findings;
}
