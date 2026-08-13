import type { Finding } from "../types.js";
import {
  isMetaOrDocLine,
  lineAt,
  lineOfMatch,
  type SourceFile,
} from "../utils/fs.js";

function isClientFile(file: SourceFile): boolean {
  const p = file.relativePath.replace(/\\/g, "/");
  if (/\.(tsx|jsx|vue|svelte|html|css|scss)$/i.test(p)) return true;
  if (/(^|\/)(components|pages|app|views|ui|client|frontend|public)\//i.test(p)) {
    return /\.(ts|js|mjs|cjs)$/i.test(p);
  }
  return (
    /\.(ts|js|mjs|cjs)$/i.test(p) &&
    /\b(from\s+['"]react(?:-dom)?['"]|require\(\s*['"]react(?:-dom)?['"]|from\s+['"]next\/|from\s+['"]vue['"]|from\s+['"]svelte['"]|document\.(write|cookie|location)|window\.(localStorage|sessionStorage)|localStorage\.(getItem|setItem))\b/.test(
      file.content
    )
  );
}

export function scanClient(files: SourceFile[]): Finding[] {
  const findings: Finding[] = [];
  const clientFiles = files.filter(isClientFile);

  let hasCspMeta = false;
  let hasXssSanitize = false;

  for (const file of clientFiles) {
    const { content, relativePath } = file;

    if (/Content-Security-Policy/i.test(content)) {
      hasCspMeta = true;
    }

    if (/\b(DOMPurify|sanitize-html|xss)\b/.test(content)) {
      hasXssSanitize = true;
    }

    const dangerHtml = /dangerouslySetInnerHTML\s*=/g;
    let match: RegExpExecArray | null;
    while ((match = dangerHtml.exec(content)) !== null) {
      if (isMetaOrDocLine(lineAt(content, match.index))) continue;
      findings.push({
        id: `client-dangerously-html:${relativePath}:${match.index}`,
        domain: "client",
        severity: "high",
        title: "Unsanitized HTML rendering (dangerouslySetInnerHTML)",
        description: "React dangerouslySetInnerHTML can enable XSS if content is user-controlled.",
        file: relativePath,
        line: lineOfMatch(content, match.index),
        recommendation: "Sanitize HTML with a trusted library or avoid injecting raw HTML.",
      });
    }

    const evalUse = /(?<![\w$.])eval\s*\(/g;
    while ((match = evalUse.exec(content)) !== null) {
      const line = lineAt(content, match.index);
      if (isMetaOrDocLine(line) || /['"`].*eval\s*\(/.test(line)) continue;
      findings.push({
        id: `client-eval:${relativePath}:${match.index}`,
        domain: "client",
        severity: "critical",
        title: "eval() usage in client code",
        description: "eval can execute arbitrary code and is a common XSS/RCE foothold.",
        file: relativePath,
        line: lineOfMatch(content, match.index),
        recommendation: "Replace eval with safe parsing or typed alternatives.",
      });
    }

    const docWrite = /document\.write\s*\(/g;
    while ((match = docWrite.exec(content)) !== null) {
      if (isMetaOrDocLine(lineAt(content, match.index))) continue;
      findings.push({
        id: `client-document-write:${relativePath}:${match.index}`,
        domain: "client",
        severity: "medium",
        title: "document.write usage",
        description: "document.write can introduce XSS and break modern page loading.",
        file: relativePath,
        line: lineOfMatch(content, match.index),
        recommendation: "Use DOM APIs or framework rendering instead of document.write.",
      });
    }

    const localStorageToken =
      /localStorage\.(setItem|getItem)\s*\(\s*['"`](token|access_token|auth|jwt|password)/gi;
    while ((match = localStorageToken.exec(content)) !== null) {
      findings.push({
        id: `client-localstorage-token:${relativePath}:${match.index}`,
        domain: "client",
        severity: "high",
        title: "Auth token stored in localStorage",
        description: "Tokens in localStorage are readable by any XSS on the origin.",
        file: relativePath,
        line: lineOfMatch(content, match.index),
        recommendation: "Prefer httpOnly Secure cookies for session tokens when possible.",
      });
    }

    if (/http:\/\//i.test(content) && !/localhost|127\.0\.0\.1/i.test(content)) {
      const httpMatch = /http:\/\/[^\s'"`]+/i.exec(content);
      if (httpMatch) {
        findings.push({
          id: `client-insecure-http:${relativePath}:${httpMatch.index}`,
          domain: "client",
          severity: "medium",
          title: "Insecure HTTP URL in client code",
          description: "Cleartext HTTP endpoints expose traffic to interception.",
          file: relativePath,
          line: lineOfMatch(content, httpMatch.index),
          recommendation: "Use HTTPS for all production endpoints.",
        });
      }
    }

    if (/target=["']_blank["']/.test(content) && !/rel=["'][^"']*noopener/.test(content)) {
      const blank = /target=["']_blank["']/.exec(content);
      if (blank) {
        findings.push({
          id: `client-noopener:${relativePath}:${blank.index}`,
          domain: "client",
          severity: "low",
          title: "target=_blank without rel=noopener",
          description: "Opened pages can access window.opener (tabnabbing risk).",
          file: relativePath,
          line: lineOfMatch(content, blank.index),
          recommendation: "Add rel=\"noopener noreferrer\" to external links.",
        });
      }
    }
  }

  const looksLikeWebUi = clientFiles.some((f) =>
    /\.(tsx|jsx|vue|svelte|html)$/i.test(f.relativePath) ||
    /(^|\/)(components|pages|app|views|ui|client|frontend|public)\//i.test(
      f.relativePath.replace(/\\/g, "/")
    )
  );

  if (looksLikeWebUi && !hasCspMeta) {
    const hasFramework = files.some((f) =>
      /next\.config|vite\.config|nuxt\.config/i.test(f.relativePath)
    );
    if (!hasFramework) {
      findings.push({
        id: "client-missing-csp",
        domain: "client",
        severity: "medium",
        title: "No Content-Security-Policy signal found",
        description: "CSP was not detected in HTML/meta or config files scanned.",
        recommendation: "Add a strict CSP via meta tag or HTTP headers to reduce XSS impact.",
      });
    }
  }

  if (
    clientFiles.some((f) => /dangerouslySetInnerHTML|innerHTML\s*=/.test(f.content)) &&
    !hasXssSanitize
  ) {
    findings.push({
      id: "client-missing-sanitize-lib",
      domain: "client",
      severity: "info",
      title: "HTML injection without obvious sanitizer dependency",
      description: "Raw HTML usage found but no common sanitizer library reference was detected.",
      recommendation: "Adopt DOMPurify or equivalent and apply it consistently.",
    });
  }

  return findings;
}
