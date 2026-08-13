import type { Finding } from "../types.js";
import { lineOfMatch, type SourceFile } from "../utils/fs.js";

const PATTERNS: Array<{
  id: string;
  title: string;
  severity: Finding["severity"];
  regex: RegExp;
  recommendation: string;
}> = [
  {
    id: "aws-access-key",
    title: "Possible AWS access key",
    severity: "critical",
    regex: /\bAKIA[0-9A-Z]{16}\b/g,
    recommendation: "Rotate the key and move credentials to a secret manager or env vars outside the repo.",
  },
  {
    id: "generic-api-key",
    title: "Hardcoded API key / secret assignment",
    severity: "high",
    regex:
      /\b(api[_-]?key|secret|token|password|passwd|private[_-]?key)\b\s*[:=]\s*['"][^'"]{8,}['"]/gi,
    recommendation: "Remove secrets from source. Use environment variables or a vault.",
  },
  {
    id: "private-key-block",
    title: "Private key material in repository",
    severity: "critical",
    regex: /-----BEGIN (RSA |EC |OPENSSH )?PRIVATE KEY-----/g,
    recommendation: "Delete the key from git history if committed, rotate it, and store keys outside the repo.",
  },
  {
    id: "jwt-like",
    title: "Possible hardcoded JWT",
    severity: "high",
    regex: /\beyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\b/g,
    recommendation: "Do not embed JWTs in source. Issue tokens at runtime.",
  },
  {
    id: "slack-token",
    title: "Possible Slack token",
    severity: "high",
    regex: /\bxox[baprs]-[0-9A-Za-z-]{10,}\b/g,
    recommendation: "Revoke the token in Slack and store replacements in secrets.",
  },
  {
    id: "github-pat",
    title: "Possible GitHub personal access token",
    severity: "critical",
    regex: /\bghp_[A-Za-z0-9]{36}\b/g,
    recommendation: "Revoke the PAT immediately and use fine-scoped tokens via CI secrets.",
  },
];

const ENV_COMMIT_HINT =
  /(^|\/)\.env(\.|$)/i;

export function scanSecrets(files: SourceFile[]): Finding[] {
  const findings: Finding[] = [];

  for (const file of files) {
    if (ENV_COMMIT_HINT.test(file.relativePath) && !file.relativePath.endsWith(".example")) {
      findings.push({
        id: `secrets-env-file:${file.relativePath}`,
        domain: "secrets",
        severity: "high",
        title: "Environment file present in workspace",
        description: `${file.relativePath} looks like a live env file and may contain secrets.`,
        file: file.relativePath,
        recommendation: "Ensure .env files are gitignored; commit only .env.example with placeholders.",
      });
    }

    for (const pattern of PATTERNS) {
      pattern.regex.lastIndex = 0;
      let match: RegExpExecArray | null;
      while ((match = pattern.regex.exec(file.content)) !== null) {
        findings.push({
          id: `secrets-${pattern.id}:${file.relativePath}:${match.index}`,
          domain: "secrets",
          severity: pattern.severity,
          title: pattern.title,
          description: `Matched pattern in ${file.relativePath}.`,
          file: file.relativePath,
          line: lineOfMatch(file.content, match.index),
          recommendation: pattern.recommendation,
        });
        if (findings.length > 200) return findings;
      }
    }
  }

  return findings;
}
