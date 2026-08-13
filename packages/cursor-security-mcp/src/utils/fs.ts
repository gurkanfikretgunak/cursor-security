import { promises as fs } from "node:fs";
import path from "node:path";

const IGNORE_DIRS = new Set([
  "node_modules",
  ".git",
  "dist",
  "build",
  ".next",
  "coverage",
  ".turbo",
  ".cache",
  "vendor",
  "__pycache__",
  ".venv",
  "venv",
  "target",
  ".cursor",
]);

const TEXT_EXTENSIONS = new Set([
  ".ts",
  ".tsx",
  ".js",
  ".jsx",
  ".mjs",
  ".cjs",
  ".json",
  ".yml",
  ".yaml",
  ".env",
  ".md",
  ".html",
  ".css",
  ".scss",
  ".py",
  ".go",
  ".rs",
  ".java",
  ".kt",
  ".php",
  ".rb",
  ".swift",
  ".toml",
  ".ini",
  ".conf",
  ".sh",
  ".dockerfile",
  ".graphql",
  ".sql",
  ".vue",
  ".svelte",
]);

const SPECIAL_FILENAMES = new Set([
  "dockerfile",
  "docker-compose.yml",
  "docker-compose.yaml",
  ".env",
  ".env.local",
  ".env.production",
  ".env.development",
  ".gitignore",
  ".npmrc",
  "package.json",
  "package-lock.json",
  "pnpm-lock.yaml",
  "yarn.lock",
  "composer.json",
  "requirements.txt",
  "pyproject.toml",
  "go.mod",
  "cargo.toml",
  "next.config.js",
  "next.config.mjs",
  "next.config.ts",
  "vite.config.ts",
  "vite.config.js",
  "nuxt.config.ts",
  "wrangler.toml",
  "vercel.json",
  "nginx.conf",
  "license",
  "licence",
  "readme",
  "readme.md",
  "security.md",
]);

export interface SourceFile {
  absolutePath: string;
  relativePath: string;
  content: string;
}

export async function resolveProjectPath(inputPath?: string): Promise<string> {
  const candidate = path.resolve(inputPath || process.cwd());
  const stat = await fs.stat(candidate);
  if (!stat.isDirectory()) {
    throw new Error(`Path is not a directory: ${candidate}`);
  }
  return candidate;
}

export async function walkSourceFiles(
  root: string,
  maxFiles = 800
): Promise<SourceFile[]> {
  const results: SourceFile[] = [];

  async function walk(dir: string): Promise<void> {
    if (results.length >= maxFiles) return;

    let entries;
    try {
      entries = await fs.readdir(dir, { withFileTypes: true });
    } catch {
      return;
    }

    for (const entry of entries) {
      if (results.length >= maxFiles) break;
      const absolutePath = path.join(dir, entry.name);

      if (entry.isDirectory()) {
        if (IGNORE_DIRS.has(entry.name)) continue;
        await walk(absolutePath);
        continue;
      }

      if (!entry.isFile()) continue;

      const lower = entry.name.toLowerCase();
      const ext = path.extname(lower);
      const isText =
        TEXT_EXTENSIONS.has(ext) ||
        SPECIAL_FILENAMES.has(lower) ||
        lower.startsWith(".env");

      if (!isText) continue;

      try {
        const content = await fs.readFile(absolutePath, "utf8");
        if (content.length > 500_000) continue;
        results.push({
          absolutePath,
          relativePath: path.relative(root, absolutePath),
          content,
        });
      } catch {
        // skip unreadable files
      }
    }
  }

  await walk(root);
  return results;
}

export async function readJsonIfExists<T>(
  filePath: string
): Promise<T | null> {
  try {
    const raw = await fs.readFile(filePath, "utf8");
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export function lineOfMatch(content: string, index: number): number {
  return content.slice(0, index).split(/\r?\n/).length;
}

export function lineAt(content: string, index: number): string {
  const start = content.lastIndexOf("\n", index - 1) + 1;
  const end = content.indexOf("\n", index);
  return content.slice(start, end === -1 ? undefined : end);
}

/** Skip matches that live in prose/meta strings (titles, descriptions, docs). */
export function isMetaOrDocLine(line: string): boolean {
  const trimmed = line.trim();
  if (/^(title|description|recommendation|reason|summary)\s*:/.test(trimmed)) {
    return true;
  }
  if (/^\*\*?Recommendation/.test(trimmed)) return true;
  if (/^(\/\/|\/\*|\*|\#)\s/.test(trimmed)) return true;
  return false;
}

export function isScannerImplementationFile(relativePath: string): boolean {
  const normalized = relativePath.replace(/\\/g, "/");
  return (
    /(^|\/)src\/scanners\//.test(normalized) ||
    /(^|\/)packages\/cursor-security-mcp\/src\/scanners\//.test(normalized)
  );
}
