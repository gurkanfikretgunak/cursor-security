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
      runs: Array<{
        results: Array<{
          locations: Array<{ physicalLocation?: { artifactLocation?: { uri?: string } } }>;
        }>;
      }>;
    };
    assert.equal(sarif.version, "2.1.0");
    assert.ok(Array.isArray(sarif.runs[0]?.results));
    for (const result of sarif.runs[0]?.results ?? []) {
      assert.ok(result.locations?.length >= 1);
      assert.ok(result.locations[0]?.physicalLocation?.artifactLocation?.uri);
    }
  });

  it("gives repo-level findings a SARIF location", () => {
    const sarif = toSarif({
      projectPath: ".",
      scannedAt: new Date().toISOString(),
      overallScore: 80,
      grade: "B",
      summary: "test",
      domains: [],
      services: [],
      findings: [
        {
          id: "backend-missing-rate-limit",
          domain: "backend",
          severity: "medium",
          title: "No rate limiting library/signal detected",
          description: "Backend code present but no common rate-limit middleware was found.",
          recommendation: "Add rate limiting on auth and expensive endpoints.",
        },
      ],
    }) as {
      runs: Array<{
        results: Array<{
          locations: Array<{ physicalLocation?: { artifactLocation?: { uri?: string } } }>;
        }>;
      }>;
    };
    assert.equal(
      sarif.runs[0]?.results[0]?.locations[0]?.physicalLocation?.artifactLocation?.uri,
      "README.md",
    );
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
