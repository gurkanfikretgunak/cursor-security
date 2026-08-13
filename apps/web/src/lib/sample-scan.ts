export type LabScanReport = {
  projectPath: string;
  scannedAt: string;
  overallScore: number;
  grade: "A" | "B" | "C" | "D" | "F";
  summary: string;
  findings: Array<{
    id: string;
    domain: string;
    severity: "critical" | "high" | "medium" | "low" | "info";
    title: string;
    description: string;
    recommendation: string;
  }>;
};

/** Compact lab scan of this control surface — useful without cloning the repo into Vercel. */
export function buildLabScanReport(projectLabel: string): LabScanReport {
  const projectPath = projectLabel.trim() || "cursor-security";
  return {
    projectPath,
    scannedAt: new Date().toISOString(),
    overallScore: 71,
    grade: "C",
    summary:
      "Lab scan of the live control surface. Persistence, email delivery, and blended JWT bind still open.",
    findings: [
      {
        id: "lab-db",
        domain: "config",
        severity: "high",
        title: "DATABASE_URL is not wired — audit, orgs, and scans are cookie-backed",
        description:
          "Without Postgres, evidence lives in a signed lab cookie and is lost on logout or cookie expiry.",
        recommendation:
          "Set DATABASE_URL on the web service and Auth.js adapter so tenants and scans persist.",
      },
      {
        id: "lab-smtp",
        domain: "backend",
        severity: "high",
        title: "SMTP is not configured — magic-link email cannot be delivered",
        description:
          "The Email provider is gated on a remote database. Test-login is the only working sign-in path.",
        recommendation:
          "Configure AUTH_EMAIL / SMTP after Postgres, then disable test-login in production.",
      },
      {
        id: "lab-blended",
        domain: "agent",
        severity: "medium",
        title: "Blended JWT bind can fail if the device cookie outlives the barrier",
        description:
          "X-ray control 05 stays open when a leftover device JWT does not match the current barrier key.",
        recommendation:
          "Re-issue the device JWT when bindBlendedSession sees a barrier mismatch.",
      },
      {
        id: "lab-test-login",
        domain: "backend",
        severity: "medium",
        title: "Credentials test-login is enabled in production",
        description:
          "Any email plus AUTH_TEST_PASSWORD creates a session. Fine for the lab; not for a real tenant.",
        recommendation:
          "Gate test-login on a non-production flag once magic-link email works.",
      },
      {
        id: "lab-cookie",
        domain: "config",
        severity: "low",
        title: "Lab evidence cookie is size-capped and ephemeral",
        description:
          "Scan history keeps summaries and top findings only. Full MCP reports need Postgres.",
        recommendation:
          "Ingest MCP/CLI JSON after DATABASE_URL is set if you need the full report blob.",
      },
    ],
  };
}

export function compactFindings(
  findings: unknown,
  limit = 6,
): Array<{ severity: string; title: string }> {
  if (!Array.isArray(findings)) return [];
  const out: Array<{ severity: string; title: string }> = [];
  for (const item of findings) {
    if (!item || typeof item !== "object") continue;
    const row = item as { severity?: unknown; title?: unknown };
    const title = typeof row.title === "string" ? row.title.trim() : "";
    if (!title) continue;
    const severity =
      typeof row.severity === "string" && row.severity.trim()
        ? row.severity.trim().toLowerCase()
        : "info";
    out.push({
      severity,
      title: title.slice(0, 96),
    });
    if (out.length >= limit) break;
  }
  return out;
}
