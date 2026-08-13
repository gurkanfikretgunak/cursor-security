import Link from "next/link";
import { redirect } from "next/navigation";
import { desc, eq, or } from "drizzle-orm";
import { requireUser } from "masterfabric-next-sec/auth";
import { auth } from "@/auth";
import { db } from "@/db";
import { securityScans } from "@/db/schema";
import { listUserOrgs } from "@/lib/orgs";
import { hasRemoteDatabase } from "@/lib/db-mode";
import { ScanIngestForm } from "@/components/scan-ingest-form";

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

  const scans = persist
    ? await db
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
    : [];

  return (
    <div className="mx-auto w-full max-w-3xl flex-1 px-6 py-12">
      <p className="font-mono text-xs font-medium uppercase tracking-[0.14em] text-accent">
        Repository security scans
      </p>
      <h1 className="mt-3 text-3xl font-semibold tracking-tight">
        MCP scan history
      </h1>
      <p className="mt-2 text-muted">
        Persist reports from{" "}
        <code className="font-mono text-sm">@cursor-security/mcp</code>, the
        CLI, or GitHub Action. This grade is the repo scan score — separate from
        the auth X-ray card.
      </p>
      <p className="mt-4 text-sm">
        <Link href="/app" className="underline">
          ← Back to Security X-ray
        </Link>
      </p>

      {!persist ? (
        <p className="mt-6 border border-line bg-surface px-4 py-3 text-sm text-muted">
          Scan history needs a remote DATABASE_URL. Auth still works; ingest is
          disabled until Postgres is wired.
        </p>
      ) : null}

      <section className="mt-10 border border-line px-5 py-5">
        <h2 className="text-lg font-semibold">Ingest a report</h2>
        <p className="mt-2 text-[15px] leading-7 text-muted">
          From Cursor: run <code className="font-mono text-xs">security_scan_full</code>{" "}
          and paste the JSON <code className="font-mono text-xs">report</code> object.
          Or:{" "}
          <code className="font-mono text-xs">
            npm run scan -w @cursor-security/mcp -- --format json
          </code>
        </p>
        {persist ? (
          <ScanIngestForm />
        ) : (
          <p className="mt-3 text-sm text-muted">Ingest form is offline.</p>
        )}
      </section>

      <section className="mt-12">
        <h2 className="text-xl font-semibold">Recent scans</h2>
        {scans.length === 0 ? (
          <p className="mt-4 text-muted">No scans yet. Ingest one above.</p>
        ) : (
          <ul className="mt-6 space-y-4">
            {scans.map((scan) => {
              const top = (
                (scan.report as { findings?: Array<{ severity?: string; title?: string }> })
                  ?.findings ?? []
              ).slice(0, 3);
              return (
                <li
                  key={scan.id}
                  className="border border-line px-4 py-4"
                >
                  <div className="flex flex-wrap items-baseline justify-between gap-3">
                    <div>
                      <p className="font-medium">{scan.projectLabel}</p>
                      <p className="mt-1 font-mono text-xs text-muted">
                        {scan.source} · {scan.createdAt.toISOString()} ·{" "}
                        {scan.findingCount} findings
                      </p>
                    </div>
                    <p className="font-mono text-2xl font-semibold text-accent">
                      {scan.grade}{" "}
                      <span className="text-base text-muted">
                        {scan.overallScore}/100
                      </span>
                    </p>
                  </div>
                  {scan.summary ? (
                    <p className="mt-3 text-[15px] leading-7 text-muted">
                      {scan.summary}
                    </p>
                  ) : null}
                  {top.length > 0 ? (
                    <ul className="mt-3 space-y-1 font-mono text-xs text-muted">
                      {top.map((f, i) => (
                        <li key={`${scan.id}-${i}`}>
                          [{(f.severity || "?").toUpperCase()}] {f.title}
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
