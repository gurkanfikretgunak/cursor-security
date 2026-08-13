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
import { describeAuditEvent } from "@/lib/security-report";
import { AuditEventList, type AuditListItem } from "@/components/audit-event-list";

function toItems(
  events: Array<{
    id: string;
    event: string;
    createdAt: Date;
    actorUserId?: string | null;
    orgId?: string | null;
    resourceType?: string | null;
    resourceId?: string | null;
    ip?: string | null;
    userAgent?: string | null;
    metadata?: Record<string, unknown> | null;
  }>,
): AuditListItem[] {
  return events.map((e) => ({
    id: e.id,
    event: e.event,
    label: describeAuditEvent(e.event),
    createdAt: e.createdAt.toISOString(),
    actorUserId: e.actorUserId ?? null,
    orgId: e.orgId ?? null,
    resourceType: e.resourceType ?? null,
    resourceId: e.resourceId ?? null,
    ip: e.ip ?? null,
    userAgent: e.userAgent ?? null,
    metadata: e.metadata ?? null,
  }));
}

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
          Tenant activity for this lab session. Click a row to expand detail.
        </p>
        <p className="mt-4">
          <Link href="/app" className="text-sm underline">
            ← Back to app
          </Link>
        </p>
        <div className="mt-8">
          <AuditEventList events={toItems(events)} />
        </div>
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
        Append-only events for this tenant. Newest first.
      </p>
      <p className="mt-4">
        <Link href="/app" className="text-sm underline">
          ← Back to app
        </Link>
      </p>
      <div className="mt-8">
        <AuditEventList events={toItems(events)} />
      </div>
    </div>
  );
}
