import assert from "node:assert/strict";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, it } from "node:test";
import { runDomainScan } from "../src/scanners/index.js";
import { toSarif } from "../src/sarif.js";
import { filterFindings, isPathIgnored, loadIgnoreRules } from "../src/ignore.js";

const here = path.dirname(fileURLToPath(import.meta.url));
const fixture = path.join(here, "../fixtures/risky-app");

describe("cursor-security scanners", () => {
  it("flags secrets, client, backend, deps, and agent issues in fixture", async () => {
    const report = await runDomainScan("full", { projectPath: fixture });
    assert.ok(report.overallScore < 90);
    const titles = report.findings.map((f) => f.title).join(" | ");
    assert.match(titles, /API key|secret|Hardcoded/i);
    assert.match(titles, /dangerouslySetInnerHTML|localStorage/i);
    assert.match(titles, /CORS|SQL/i);
    assert.match(titles, /event-stream|Floating|Dangerous npm script/i);
    assert.match(titles, /auto-approve|Dangerous MCP|sandbox/i);
  });

  it("exports valid SARIF shape", async () => {
    const report = await runDomainScan("secrets", { projectPath: fixture });
    const sarif = toSarif(report) as {
      version: string;
      runs: Array<{ results: unknown[] }>;
    };
    assert.equal(sarif.version, "2.1.0");
    assert.ok(Array.isArray(sarif.runs[0]?.results));
  });

  it("supports ignore suppressions", async () => {
    const report = await runDomainScan("dependencies", { projectPath: fixture });
    const rules = await loadIgnoreRules(fixture);
    rules.ruleIds.add("deps-risky");
    rules.ruleIds.add("deps-floating");
    rules.ruleIds.add("deps-dangerous-script");
    rules.ruleIds.add("deps-missing-lockfile");
    rules.ruleIds.add("deps-no-audit-script");
    const { kept, suppressed } = filterFindings(report.findings, rules);
    assert.ok(suppressed > 0);
    assert.ok(kept.length < report.findings.length);
  });

  it("matches directory /** ignore globs", () => {
    const rules = {
      pathGlobs: ["fixtures/**"],
      findingIds: new Set<string>(),
      ruleIds: new Set<string>(),
    };
    assert.equal(isPathIgnored("fixtures/risky-app/src/server.js", rules), true);
  });
});
