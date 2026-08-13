import type { Finding } from "../types.js";
import {
  isMetaOrDocLine,
  lineAt,
  lineOfMatch,
  type SourceFile,
} from "../utils/fs.js";

const BACKEND_HINT =
  /(\/|^)(api|server|backend|routes|controllers|services|middleware|workers?)(\/|\.|$)/i;

export function scanBackend(files: SourceFile[]): Finding[] {
  const findings: Finding[] = [];
  const backendFiles = files.filter((f) => {
    const name = f.relativePath.replace(/\\/g, "/").split("/").pop()?.toLowerCase() ?? "";
    if (
      name === "package-lock.json" ||
      name === "pnpm-lock.yaml" ||
      name === "yarn.lock" ||
      name.endsWith(".md")
    ) {
      return false;
    }
    return (
      BACKEND_HINT.test(f.relativePath) ||
      /\.(py|go|php|rb|java|kt)$/i.test(f.relativePath) ||
      /(express|fastify|hono|koa|nestjs|flask|django|fastapi)/i.test(f.content)
    );
  });

  for (const file of backendFiles) {
    const { content, relativePath } = file;
    let match: RegExpExecArray | null;

    const sqlConcat =
      /(query|execute|raw)\s*\(\s*[`'"].*\$\{|(SELECT|INSERT|UPDATE|DELETE)[^;]*\+\s*\w+/gi;
    while ((match = sqlConcat.exec(content)) !== null) {
      if (isMetaOrDocLine(lineAt(content, match.index))) continue;
      findings.push({
        id: `backend-sql-concat:${relativePath}:${match.index}`,
        domain: "backend",
        severity: "critical",
        title: "Possible SQL string concatenation",
        description: "Dynamic SQL built via concatenation/interpolation is injection-prone.",
        file: relativePath,
        line: lineOfMatch(content, match.index),
        recommendation: "Use parameterized queries or an ORM query builder with bindings.",
      });
    }

    const corsOpen = /cors\(\s*\{\s*origin\s*:\s*['"`]\*['"`]/gi;
    while ((match = corsOpen.exec(content)) !== null) {
      if (isMetaOrDocLine(lineAt(content, match.index))) continue;
      findings.push({
        id: `backend-cors-star:${relativePath}:${match.index}`,
        domain: "backend",
        severity: "high",
        title: "Overly permissive CORS (origin: *)",
        description: "Wildcard CORS can allow any site to call credentialed or sensitive APIs.",
        file: relativePath,
        line: lineOfMatch(content, match.index),
        recommendation: "Allowlist trusted origins explicitly; avoid credentials with *.",
      });
    }

    const noAuthRoute =
      /\.(get|post|put|patch|delete)\(\s*['"`]\/(admin|internal|debug|metrics)/gi;
    while ((match = noAuthRoute.exec(content)) !== null) {
      const slice = content.slice(match.index, match.index + 400);
      if (!/(auth|authorize|requireAuth|middleware|guard|verify)/i.test(slice)) {
        findings.push({
          id: `backend-sensitive-route:${relativePath}:${match.index}`,
          domain: "backend",
          severity: "high",
          title: "Sensitive route without nearby auth middleware",
          description: "Admin/internal/debug route appears without an obvious auth guard nearby.",
          file: relativePath,
          line: lineOfMatch(content, match.index),
          recommendation: "Protect sensitive routes with authentication and authorization checks.",
        });
      }
    }

    if (/disable\s*[:=]\s*true/i.test(content) && /helmet|csrf|csrfProtection/i.test(content)) {
      findings.push({
        id: `backend-security-middleware-disabled:${relativePath}`,
        domain: "backend",
        severity: "medium",
        title: "Security middleware may be disabled",
        description: "Helmet/CSRF related config appears disabled in this file.",
        file: relativePath,
        recommendation: "Keep security middleware enabled in production builds.",
      });
    }

    const shellExec =
      /\b(?:execSync|exec|spawn(?:Sync)?)\s*\(\s*(?:[`'"][^`'"]*\$\{|[^)]+\+)/g;
    while ((match = shellExec.exec(content)) !== null) {
      const line = lineAt(content, match.index);
      if (isMetaOrDocLine(line) || /=\s*\//.test(line)) continue;
      findings.push({
        id: `backend-command-injection:${relativePath}:${match.index}`,
        domain: "backend",
        severity: "critical",
        title: "Possible command injection risk",
        description: "Shell/process APIs combined with string interpolation can execute attacker input.",
        file: relativePath,
        line: lineOfMatch(content, match.index),
        recommendation: "Avoid shells; pass argument arrays and validate/allowlist inputs.",
      });
    }

    const debugTrue = /\b(DEBUG|NODE_ENV)\b\s*[:=]\s*['"]?(true|development)['"]?/g;
    if (
      /\b(app\.listen|createServer|FastAPI|Flask)\b/.test(content) ||
      /\bfrom\s+['"]express['"]|\brequire\(\s*['"]express['"]/.test(content)
    ) {
      while ((match = debugTrue.exec(content)) !== null) {
        if (isMetaOrDocLine(lineAt(content, match.index))) continue;
        findings.push({
          id: `backend-debug-flag:${relativePath}:${match.index}`,
          domain: "backend",
          severity: "low",
          title: "Debug/development flag in server code",
          description: "Hardcoded debug/development settings can leak stack traces in production.",
          file: relativePath,
          line: lineOfMatch(content, match.index),
          recommendation: "Drive debug mode from environment and keep production hardened.",
        });
      }
    }

    if (
      /\bjwt\.sign\b|\bjsonwebtoken\b/.test(content) &&
      /(?:secret|privateKey)\s*[:=]\s*['"][^'"]+['"]/.test(content)
    ) {
      findings.push({
        id: `backend-weak-jwt-secret:${relativePath}`,
        domain: "backend",
        severity: "high",
        title: "JWT secret may be hardcoded",
        description: "JWT signing appears to use a static/hardcoded secret.",
        file: relativePath,
        recommendation: "Load strong secrets from a vault/env; rotate regularly.",
      });
    }

    if (/cookie\s*\(|res\.cookie|Set-Cookie/i.test(content)) {
      if (!/httpOnly/i.test(content) || !/secure/i.test(content)) {
        findings.push({
          id: `backend-cookie-flags:${relativePath}`,
          domain: "backend",
          severity: "medium",
          title: "Cookies may miss Secure/HttpOnly flags",
          description: "Cookie handling found without clear Secure and HttpOnly settings.",
          file: relativePath,
          recommendation: "Set HttpOnly, Secure, and SameSite for session cookies.",
        });
      }
    }
  }

  const hasRateLimit = files.some((f) =>
    /rateLimit|rate-limit|express-rate-limit|bottleneck|slowDown/i.test(f.content)
  );
  if (backendFiles.length > 0 && !hasRateLimit) {
    findings.push({
      id: "backend-missing-rate-limit",
      domain: "backend",
      severity: "medium",
      title: "No rate limiting library/signal detected",
      description: "Backend code present but no common rate-limit middleware was found.",
      recommendation: "Add rate limiting on auth and expensive endpoints.",
    });
  }

  return findings;
}
