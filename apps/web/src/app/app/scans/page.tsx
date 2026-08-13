import Link from "next/link";
import { redirect } from "next/navigation";
import { desc, eq, or } from "drizzle-orm";
import { requireUser } from "masterfabric-next-sec/auth";
import { auth } from "@/auth";
import { db } from "@/db";
import { securityScans } from "@/db/schema";
import { listUserOrgs } from "@/lib/orgs";
import { hasRemoteDatabase } from "@/lib/db-mode";
import { listLabScans } from "@/lib/lab-store";
import { compactFindings } from "@/lib/sample-scan";
import { formatRelativeTime } from "@/lib/format";
import { ScanIngestForm } from "@/components/scan-ingest-form";

type ScanCard = {
  id: string;
  projectLabel: string;
  overallScore: number;
  grade: string;
  summary: string;
  findingCount: number;
  source: string;
  createdAt: string;
  findings: Array<{ severity: string; title: string }>;
};

function severityClass(severity: string): string {
  if (severity === "critical" || severity === "high") return "text-red-700";
  if (severity === "medium") return "text-amber-800";
  return "text-muted";
}

export default async function ScansPage() {
  const session = await auth();
  let user;
  try {
    user = requireUser(session);
  } catch {
    redirect("/login");
  }

  const persist = hasRemoteDatabase();
  const orgs = persist ? await listUserOrgs(user.id) : [];
  const orgIds = orgs.map((o) => o.id);
  const filter =
    orgIds.length > 0
      ? or(
          eq(securityScans.actorUserId, user.id),
          ...orgIds.map((id) => eq(securityScans.orgId, id)),
        )
      : eq(securityScans.actorUserId, user.id);

  const scans: ScanCard[] = persist
    ? (
        await db
          .select({
            id: securityScans.id,
            projectLabel: securityScans.projectLabel,
            overallScore: securityScans.overallScore,
            grade: securityScans.grade,
            summary: securityScans.summary,
            findingCount: securityScans.findingCount,
            source: securityScans.source,
            createdAt: securityScans.createdAt,
            report: securityScans.report,
          })
          .from(securityScans)
          .where(filter)
          .orderBy(desc(securityScans.createdAt))
          .limit(30)
      ).map((scan) => ({
        id: scan.id,
        projectLabel: scan.projectLabel,
        overallScore: scan.overallScore,
        grade: scan.grade,
        summary: scan.summary,
        findingCount: scan.findingCount,
        source: scan.source,
        createdAt: scan.createdAt.toISOString(),
        findings: compactFindings(
          (scan.report as { findings?: unknown })?.findings,
          4,
        ),
      }))
    : await listLabScans();

  const latest = scans[0] ?? null;

  return (
    <div className="mx-auto w-full max-w-3xl flex-1 px-6 py-12">
      <p className="font-mono text-xs font-medium uppercase tracking-[0.14em] text-accent">
        Repository security scans
      </p>
      <h1 className="mt-3 text-3xl font-semibold tracking-tight">
        Repo scan history
      </h1>
      <p className="mt-2 text-muted">
        Lab scan this control surface in one click, or paste an MCP / CLI JSON
        report. Separate from the auth X-ray card.
      </p>
      <p className="mt-4 text-sm">
        <Link href="/app" className="underline">
          ← Back to Security X-ray
        </Link>
      </p>

      {!persist ? (
        <p className="mt-6 border border-line bg-surface px-4 py-3 text-sm text-muted">
          History is stored in a signed lab cookie (summaries and top findings).
          Wire DATABASE_URL for durable Postgres reports.
        </p>
      ) : null}

      {latest ? (
        <section className="mt-10 border border-line px-5 py-5">
          <p className="font-mono text-xs uppercase tracking-[0.14em] text-accent">
            Latest
          </p>
          <div className="mt-3 flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold">{latest.projectLabel}</h2>
              <p className="mt-1 font-mono text-xs text-muted">
                {latest.source} · {formatRelativeTime(latest.createdAt)} ·{" "}
                {latest.findingCount} findings
              </p>
            </div>
            <p className="font-mono text-4xl font-semibold text-accent">
              {latest.grade}
              <span className="ml-2 text-base font-normal text-muted">
                {latest.overallScore}/100
              </span>
            </p>
          </div>
          {latest.summary ? (
            <p className="mt-4 text-[15px] leading-7 text-muted">
              {latest.summary}
            </p>
          ) : null}
        </section>
      ) : null}

      <section className="mt-10 border border-line px-5 py-5">
        <h2 className="text-lg font-semibold">Run a scan</h2>
        <p className="mt-2 text-[15px] leading-7 text-muted">
          Start with a lab scan of this site. Paste JSON only if you already
          ran the MCP scanner locally.
        </p>
        <ScanIngestForm defaultLabel="cursor-security" />
      </section>

      <section className="mt-12">
        <h2 className="text-xl font-semibold">History</h2>
        {scans.length === 0 ? (
          <p className="mt-4 text-muted">
            No scans yet. Run a lab scan above — it takes one click.
          </p>
        ) : (
          <ul className="mt-6 space-y-3">
            {scans.map((scan) => (
              <li key={scan.id} className="border border-line px-4 py-4">
                <div className="flex flex-wrap items-baseline justify-between gap-3">
                  <div>
                    <p className="font-medium">{scan.projectLabel}</p>
                    <p className="mt-1 font-mono text-xs text-muted">
                      {scan.source} · {formatRelativeTime(scan.createdAt)} ·{" "}
                      {scan.findingCount} findings
                    </p>
                  </div>
                  <p className="font-mono text-2xl font-semibold text-accent">
                    {scan.grade}{" "}
                    <span className="text-base font-normal text-muted">
                      {scan.overallScore}/100
                    </span>
                  </p>
                </div>
                {scan.summary ? (
                  <p className="mt-3 text-[15px] leading-7 text-muted">
                    {scan.summary}
                  </p>
                ) : null}
                {scan.findings.length > 0 ? (
                  <ul className="mt-3 space-y-1.5">
                    {scan.findings.map((f, i) => (
                      <li
                        key={`${scan.id}-${i}`}
                        className="flex gap-2 font-mono text-xs leading-5"
                      >
                        <span
                          className={`w-16 shrink-0 uppercase ${severityClass(f.severity)}`}
                        >
                          {f.severity}
                        </span>
                        <span className="text-foreground">{f.title}</span>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
