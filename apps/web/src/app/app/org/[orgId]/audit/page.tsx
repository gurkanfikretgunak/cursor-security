import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { desc, eq } from "drizzle-orm";
import { requireUser } from "masterfabric-next-sec/auth";
import { auth } from "@/auth";
import { db } from "@/db";
import { auditEvents, organizations } from "@/db/schema";
import { requireOrgRole } from "@/lib/orgs";
import { hasRemoteDatabase } from "@/lib/db-mode";
import { listLabOrgs, readLabEvents } from "@/lib/lab-store";

export default async function OrgAuditPage({
  params,
}: {
  params: Promise<{ orgId: string }>;
}) {
  const { orgId } = await params;
  const session = await auth();
  let user;
  try {
    user = requireUser(session);
  } catch {
    redirect("/login");
  }

  try {
    await requireOrgRole(orgId, user.id, "admin");
  } catch {
    redirect("/app");
  }

  if (!hasRemoteDatabase()) {
    const labOrg = (await listLabOrgs()).find((o) => o.id === orgId);
    if (!labOrg) notFound();
    const events = (await readLabEvents()).filter((e) => e.orgId === orgId);
    return (
      <div className="mx-auto w-full max-w-3xl flex-1 px-6 py-12">
        <p className="font-mono text-xs text-accent">AUDIT · ADMIN+</p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight">
          {labOrg.name} audit log
        </h1>
        <p className="mt-2 text-muted">
          Lab cookie evidence for this tenant. Wire DATABASE_URL for durable
          Postgres logs.
        </p>
        <p className="mt-4">
          <Link href="/app" className="text-sm underline">
            ← Back to app
          </Link>
        </p>
        <ul className="mt-8 space-y-2">
          {events.map((e) => (
            <li key={e.id} className="border border-line bg-surface px-4 py-3">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <span className="font-mono text-sm text-accent">{e.event}</span>
                <span className="font-mono text-xs text-muted">
                  {e.createdAt.toISOString()}
                </span>
              </div>
            </li>
          ))}
          {events.length === 0 ? (
            <li className="text-sm text-muted">
              No events for this organization.
            </li>
          ) : null}
        </ul>
      </div>
    );
  }

  const [org] = await db
    .select()
    .from(organizations)
    .where(eq(organizations.id, orgId))
    .limit(1);
  if (!org) notFound();

  const events = await db
    .select()
    .from(auditEvents)
    .where(eq(auditEvents.orgId, orgId))
    .orderBy(desc(auditEvents.createdAt))
    .limit(100);

  return (
    <div className="mx-auto w-full max-w-3xl flex-1 px-6 py-12">
      <p className="font-mono text-xs text-accent">AUDIT · ADMIN+</p>
      <h1 className="mt-3 text-3xl font-semibold tracking-tight">
        {org.name} audit log
      </h1>
      <p className="mt-2 text-muted">
        Append-only events for SOC 2 logging / monitoring evidence.
      </p>
      <p className="mt-4">
        <Link href="/app" className="text-sm underline">
          ← Back to app
        </Link>
      </p>
      <ul className="mt-8 space-y-2">
        {events.map((e) => (
          <li key={e.id} className="border border-line bg-surface px-4 py-3">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <span className="font-mono text-sm text-accent">{e.event}</span>
              <span className="font-mono text-xs text-muted">
                {e.createdAt.toISOString()}
              </span>
            </div>
            <pre className="mt-2 overflow-x-auto text-xs text-muted">
              {JSON.stringify(
                {
                  actorUserId: e.actorUserId,
                  resourceType: e.resourceType,
                  resourceId: e.resourceId,
                  metadata: e.metadata,
                },
                null,
                2,
              )}
            </pre>
          </li>
        ))}
        {events.length === 0 ? (
          <li className="text-sm text-muted">No events for this organization.</li>
        ) : null}
      </ul>
    </div>
  );
}
