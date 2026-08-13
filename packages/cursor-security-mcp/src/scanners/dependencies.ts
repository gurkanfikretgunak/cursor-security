import path from "node:path";
import type { Finding } from "../types.js";
import { readJsonIfExists, type SourceFile } from "../utils/fs.js";

const RISKY_PACKAGES: Record<string, { severity: Finding["severity"]; reason: string }> = {
  "event-stream": {
    severity: "critical",
    reason: "Historically compromised supply-chain package.",
  },
  "flatmap-stream": {
    severity: "critical",
    reason: "Malicious dependency associated with event-stream incident.",
  },
  request: {
    severity: "medium",
    reason: "Deprecated HTTP client; prefer maintained alternatives (fetch, undici, got).",
  },
  "node-uuid": {
    severity: "low",
    reason: "Deprecated; use the uuid package.",
  },
  "serialize-javascript": {
    severity: "info",
    reason: "Ensure latest patched version when serializing untrusted data.",
  },
};

export async function scanDependencies(
  projectPath: string,
  files: SourceFile[]
): Promise<Finding[]> {
  const findings: Finding[] = [];
  const pkgPath = path.join(projectPath, "package.json");
  const pkg = await readJsonIfExists<{
    dependencies?: Record<string, string>;
    devDependencies?: Record<string, string>;
    scripts?: Record<string, string>;
  }>(pkgPath);

  if (!pkg) {
    const hasOther =
      files.some((f) =>
        /requirements\.txt|pyproject\.toml|go\.mod|Cargo\.toml|composer\.json/i.test(
          f.relativePath
        )
      );
    if (!hasOther) {
      findings.push({
        id: "deps-no-manifest",
        domain: "dependencies",
        severity: "info",
        title: "No package manifest detected",
        description: "Could not find package.json or other common dependency manifests.",
        recommendation: "Ensure dependency manifests are present so audits can run.",
      });
    }
    return findings;
  }

  const allDeps = {
    ...(pkg.dependencies || {}),
    ...(pkg.devDependencies || {}),
  };

  for (const [name, version] of Object.entries(allDeps)) {
    const risky = RISKY_PACKAGES[name];
    if (risky) {
      findings.push({
        id: `deps-risky:${name}`,
        domain: "dependencies",
        severity: risky.severity,
        title: `Risky or deprecated dependency: ${name}`,
        description: `${risky.reason} Declared version: ${version}`,
        file: "package.json",
        recommendation: `Review and replace or upgrade ${name}.`,
      });
    }

    if (/^https?:\/\//i.test(version) || version.startsWith("git+")) {
      findings.push({
        id: `deps-git-url:${name}`,
        domain: "dependencies",
        severity: "medium",
        title: `Dependency pinned to remote URL: ${name}`,
        description: `Version "${version}" pulls code from a remote URL/git source.`,
        file: "package.json",
        recommendation: "Prefer registry versions with lockfile integrity hashes.",
      });
    }

    if (version === "*" || version === "latest") {
      findings.push({
        id: `deps-floating:${name}`,
        domain: "dependencies",
        severity: "medium",
        title: `Floating dependency version: ${name}`,
        description: `Version "${version}" can pull unexpected releases.`,
        file: "package.json",
        recommendation: "Pin versions and commit a lockfile.",
      });
    }
  }

  const hasLock =
    files.some((f) =>
      /package-lock\.json|pnpm-lock\.yaml|yarn\.lock/.test(f.relativePath)
    );
  if (!hasLock) {
    findings.push({
      id: "deps-missing-lockfile",
      domain: "dependencies",
      severity: "high",
      title: "Missing lockfile",
      description: "No package-lock.json / pnpm-lock.yaml / yarn.lock was found.",
      recommendation: "Commit a lockfile for reproducible, auditable installs.",
    });
  }

  const scripts = pkg.scripts || {};
  for (const [scriptName, script] of Object.entries(scripts)) {
    if (/curl .+ \| (ba)?sh|wget .+ \| (ba)?sh|rm\s+-rf\s+\//i.test(script)) {
      findings.push({
        id: `deps-dangerous-script:${scriptName}`,
        domain: "dependencies",
        severity: "critical",
        title: `Dangerous npm script: ${scriptName}`,
        description: `Script contains a high-risk shell pattern: ${script}`,
        file: "package.json",
        recommendation: "Remove pipe-to-shell and destructive patterns from install/lifecycle scripts.",
      });
    }
  }

  const hasAuditScript = Object.values(scripts).some((s) => /npm audit|pnpm audit|yarn npm audit/i.test(s));
  if (!hasAuditScript) {
    findings.push({
      id: "deps-no-audit-script",
      domain: "dependencies",
      severity: "low",
      title: "No dependency audit script",
      description: "package.json scripts do not include an audit command.",
      file: "package.json",
      recommendation: "Add `npm audit` (or equivalent) to CI and local scripts.",
    });
  }

  return findings;
}
