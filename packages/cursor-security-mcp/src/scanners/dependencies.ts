import { execFile } from "node:child_process";
import path from "node:path";
import { promisify } from "node:util";
import type { Finding } from "../types.js";
import { readJsonIfExists, type SourceFile } from "../utils/fs.js";

const execFileAsync = promisify(execFile);

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

type NpmAuditVulnerability = {
  name?: string;
  severity?: string;
  via?: Array<string | { title?: string; url?: string }>;
  range?: string;
};

function mapNpmSeverity(sev?: string): Finding["severity"] {
  switch ((sev || "").toLowerCase()) {
    case "critical":
      return "critical";
    case "high":
      return "high";
    case "moderate":
    case "medium":
      return "medium";
    case "low":
      return "low";
    default:
      return "info";
  }
}

async function collectNpmAuditFindings(projectPath: string): Promise<Finding[]> {
  try {
    const { stdout } = await execFileAsync(
      "npm",
      ["audit", "--json", "--omit=dev"],
      {
        cwd: projectPath,
        timeout: 60_000,
        maxBuffer: 8 * 1024 * 1024,
      }
    );
    const parsed = JSON.parse(stdout) as {
      vulnerabilities?: Record<string, NpmAuditVulnerability>;
    };
    const findings: Finding[] = [];
    for (const [name, vuln] of Object.entries(parsed.vulnerabilities || {})) {
      const viaTitle =
        vuln.via
          ?.map((v) => (typeof v === "string" ? v : v.title || v.url || ""))
          .filter(Boolean)
          .slice(0, 2)
          .join("; ") || "See npm audit for details";
      findings.push({
        id: `deps-npm-audit:${name}`,
        domain: "dependencies",
        severity: mapNpmSeverity(vuln.severity),
        title: `npm audit: ${name}`,
        description: `${viaTitle}${vuln.range ? ` (range ${vuln.range})` : ""}`,
        file: "package-lock.json",
        recommendation: `Run npm audit fix (or upgrade ${name}) and re-scan.`,
        ruleId: "deps-npm-audit",
      });
      if (findings.length >= 40) break;
    }
    return findings;
  } catch (err) {
    const maybe = err as { stdout?: string };
    if (maybe.stdout) {
      try {
        const parsed = JSON.parse(maybe.stdout) as {
          vulnerabilities?: Record<string, NpmAuditVulnerability>;
        };
        return Object.entries(parsed.vulnerabilities || {})
          .slice(0, 40)
          .map(([name, vuln]) => ({
            id: `deps-npm-audit:${name}`,
            domain: "dependencies" as const,
            severity: mapNpmSeverity(vuln.severity),
            title: `npm audit: ${name}`,
            description: `Reported severity: ${vuln.severity || "unknown"}`,
            file: "package-lock.json",
            recommendation: `Upgrade or replace ${name}; verify with npm audit.`,
            ruleId: "deps-npm-audit",
          }));
      } catch {
        // fall through
      }
    }
    return [
      {
        id: "deps-npm-audit-unavailable",
        domain: "dependencies",
        severity: "info",
        title: "npm audit signal unavailable",
        description: "Could not parse npm audit output in this environment.",
        recommendation: "Run `npm audit --json` locally/CI and keep lockfiles committed.",
        ruleId: "deps-npm-audit",
      },
    ];
  }
}

export async function scanDependencies(
  projectPath: string,
  files: SourceFile[],
  options: { includeOsv?: boolean } = {}
): Promise<Finding[]> {
  const findings: Finding[] = [];
  const pkgPath = path.join(projectPath, "package.json");
  const pkg = await readJsonIfExists<{
    dependencies?: Record<string, string>;
    devDependencies?: Record<string, string>;
    scripts?: Record<string, string>;
  }>(pkgPath);

  if (!pkg) {
    const hasOther = files.some((f) =>
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
        ruleId: "deps-no-manifest",
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
        ruleId: "deps-risky",
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
        ruleId: "deps-git-url",
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
        ruleId: "deps-floating",
      });
    }
  }

  const hasLock = files.some((f) =>
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
      ruleId: "deps-missing-lockfile",
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
        recommendation:
          "Remove pipe-to-shell and destructive patterns from install/lifecycle scripts.",
        ruleId: "deps-dangerous-script",
      });
    }
  }

  const hasAuditScript = Object.values(scripts).some((s) =>
    /npm audit|pnpm audit|yarn npm audit/i.test(s)
  );
  if (!hasAuditScript) {
    findings.push({
      id: "deps-no-audit-script",
      domain: "dependencies",
      severity: "low",
      title: "No dependency audit script",
      description: "package.json scripts do not include an audit command.",
      file: "package.json",
      recommendation: "Add `npm audit` (or equivalent) to CI and local scripts.",
      ruleId: "deps-no-audit-script",
    });
  }

  if (options.includeOsv) {
    findings.push(...(await collectNpmAuditFindings(projectPath)));
  }

  return findings;
}
