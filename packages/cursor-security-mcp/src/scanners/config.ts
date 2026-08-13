import path from "node:path";
import type { Finding } from "../types.js";
import { readJsonIfExists, type SourceFile } from "../utils/fs.js";

export async function scanConfig(
  projectPath: string,
  files: SourceFile[]
): Promise<Finding[]> {
  const findings: Finding[] = [];

  const gitignore = files.find((f) => f.relativePath === ".gitignore");
  if (!gitignore) {
    findings.push({
      id: "config-missing-gitignore",
      domain: "config",
      severity: "high",
      title: "Missing .gitignore",
      description: "Without .gitignore, secrets and build artifacts are easy to commit.",
      recommendation: "Add a .gitignore covering .env, node_modules, keys, and build output.",
    });
  } else {
    if (!/\.env/i.test(gitignore.content)) {
      findings.push({
        id: "config-gitignore-env",
        domain: "config",
        severity: "high",
        title: ".gitignore does not ignore .env",
        description: "Environment files may be committed accidentally.",
        file: ".gitignore",
        recommendation: "Add .env and .env.* (except .env.example) to .gitignore.",
      });
    }
  }

  const dockerfiles = files.filter((f) => /dockerfile/i.test(path.basename(f.relativePath)));
  for (const file of dockerfiles) {
    if (/^\s*USER\s+root\b/im.test(file.content) || !/^\s*USER\s+/im.test(file.content)) {
      findings.push({
        id: `config-docker-user:${file.relativePath}`,
        domain: "config",
        severity: "medium",
        title: "Container may run as root",
        description: `${file.relativePath} does not define a non-root USER (or uses root).`,
        file: file.relativePath,
        recommendation: "Add a non-root USER in the final image stage.",
      });
    }
    if (/apt-get install[^\n]*\n(?![^\n]*rm -rf \/var\/lib\/apt)/i.test(file.content)) {
      findings.push({
        id: `config-docker-apt-cache:${file.relativePath}`,
        domain: "config",
        severity: "low",
        title: "APT cache may not be cleaned in Docker image",
        description: "Leaving package caches increases image size and attack surface.",
        file: file.relativePath,
        recommendation: "Clean apt lists in the same RUN layer after installs.",
      });
    }
  }

  const ciFiles = files.filter((f) =>
    /\.github\/workflows\/|\.gitlab-ci|Jenkinsfile|bitbucket-pipelines/i.test(
      f.relativePath
    )
  );
  if (ciFiles.length === 0) {
    findings.push({
      id: "config-missing-ci",
      domain: "config",
      severity: "info",
      title: "No CI workflow detected",
      description: "Automated security/lint checks are easier to enforce with CI.",
      recommendation: "Add CI jobs for lint, test, and dependency audit.",
    });
  } else {
    const ciText = ciFiles.map((f) => f.content).join("\n");
    if (!/audit|snyk|trivy|codeql|semgrep|gitleaks|secret/i.test(ciText)) {
      findings.push({
        id: "config-ci-no-security-job",
        domain: "config",
        severity: "medium",
        title: "CI present but no security scan job signal",
        description: "Workflows found, but no obvious secret/dependency/SAST scan step.",
        recommendation: "Add secret scanning and dependency auditing to CI.",
      });
    }
  }

  const securityTxt = files.find((f) =>
    /(^|\/)security\.md$|(^|\/)\.well-known\/security\.txt$/i.test(f.relativePath)
  );
  if (!securityTxt) {
    findings.push({
      id: "config-missing-security-policy",
      domain: "config",
      severity: "low",
      title: "No SECURITY.md / security.txt",
      description: "Missing vulnerability disclosure guidance for researchers.",
      recommendation: "Add SECURITY.md with a clear reporting process.",
    });
  }

  const vercel = await readJsonIfExists<{ headers?: unknown[]; rewrites?: unknown[] }>(
    path.join(projectPath, "vercel.json")
  );
  if (vercel && !vercel.headers) {
    findings.push({
      id: "config-vercel-no-headers",
      domain: "config",
      severity: "medium",
      title: "vercel.json missing security headers",
      description: "No headers configuration found for CSP/HSTS/X-Frame-Options etc.",
      file: "vercel.json",
      recommendation: "Define security headers (CSP, HSTS, X-Content-Type-Options, Referrer-Policy).",
    });
  }

  const nextConfig = files.find((f) => /next\.config\.(js|mjs|ts)$/i.test(f.relativePath));
  if (nextConfig && !/headers\s*\(|Content-Security-Policy|X-Frame-Options/i.test(nextConfig.content)) {
    findings.push({
      id: "config-next-no-headers",
      domain: "config",
      severity: "medium",
      title: "Next.js config without security headers",
      description: "next.config found but no security header helpers detected.",
      file: nextConfig.relativePath,
      recommendation: "Export headers() with CSP, HSTS, and frame protections.",
    });
  }

  const npmrc = files.find((f) => /(^|\/)\.npmrc$/i.test(f.relativePath));
  if (npmrc && /\/\/.+:_authToken=/i.test(npmrc.content)) {
    findings.push({
      id: "config-npmrc-token",
      domain: "config",
      severity: "critical",
      title: "Auth token inside .npmrc",
      description: ".npmrc appears to embed a registry auth token.",
      file: npmrc.relativePath,
      recommendation: "Use env-based npm auth (NPM_TOKEN) and never commit tokens.",
    });
  }

  return findings;
}
