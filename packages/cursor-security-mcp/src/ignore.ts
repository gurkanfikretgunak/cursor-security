import { promises as fs } from "node:fs";
import path from "node:path";
import type { Finding } from "./types.js";

export type IgnoreRules = {
  pathGlobs: string[];
  findingIds: Set<string>;
  ruleIds: Set<string>;
};

function globToRegExp(glob: string): RegExp {
  const escaped = glob
    .replace(/[.+^${}()|[\]\\]/g, "\\$&")
    .replace(/\*\*/g, "§§")
    .replace(/\*/g, "[^/]*")
    .replace(/§§/g, ".*");
  return new RegExp(`^${escaped}$`);
}

export async function loadIgnoreRules(
  projectPath: string,
  fileName = ".cursor-securityignore"
): Promise<IgnoreRules> {
  const rules: IgnoreRules = {
    pathGlobs: [],
    findingIds: new Set(),
    ruleIds: new Set(),
  };

  try {
    const raw = await fs.readFile(path.join(projectPath, fileName), "utf8");
    for (const line of raw.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      if (trimmed.startsWith("id:")) {
        rules.findingIds.add(trimmed.slice(3).trim());
        continue;
      }
      if (trimmed.startsWith("rule:")) {
        rules.ruleIds.add(trimmed.slice(5).trim());
        continue;
      }
      rules.pathGlobs.push(trimmed.replace(/\\/g, "/"));
    }
  } catch {
    // optional file
  }

  return rules;
}

export function isPathIgnored(relativePath: string, rules: IgnoreRules): boolean {
  const normalized = relativePath.replace(/\\/g, "/");
  return rules.pathGlobs.some((g) => globToRegExp(g).test(normalized));
}

export function filterFindings(
  findings: Finding[],
  rules: IgnoreRules
): { kept: Finding[]; suppressed: number } {
  const kept = findings.filter((f) => {
    if (rules.findingIds.has(f.id)) return false;
    if (f.ruleId && rules.ruleIds.has(f.ruleId)) return false;
    if (f.file && isPathIgnored(f.file, rules)) return false;
    return true;
  });
  return { kept, suppressed: findings.length - kept.length };
}
