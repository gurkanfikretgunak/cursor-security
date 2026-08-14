import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { desc, eq, or } from "drizzle-orm";
import { requireUser } from "masterfabric-next-sec/auth";
import { auth } from "@/auth";
import { db } from "@/db";
import { auditEvents, memberships, users } from "@/db/schema";
import { listOrgMembers, listUserOrgs } from "@/lib/orgs";
import { goRequest } from "@/lib/go-backend";
import {
  buildSecurityReport,
  type AuditRow,
} from "@/lib/security-report";
import { logoutAction } from "@/app/actions/auth";
import { ChannelSessionPanel } from "@/components/channel-session-panel";
import { CreateOrgForm } from "@/components/create-org-form";
import { InviteMemberForm } from "@/components/invite-member-form";
import { LiveAuditTimeline } from "@/components/live-audit-timeline";
import { hasDurableStore, hasRemoteDatabase } from "@/lib/db-mode";
import { listLabMembers, readLabEvents } from "@/lib/lab-store";

export default async function AppHomePage() {
  const session = await auth();
  let user;
  try {
    user = requireUser(session);
  } catch {
    redirect("/login");
  }

  const orgs = await listUserOrgs(user);
  const primaryOrg = orgs[0];

  let members: Array<{
    userId: string;
    email: string | null;
    name: string | null;
    role: "owner" | "admin" | "member";
  }> = [];

  const orgFilter = primaryOrg
    ? or(eq(auditEvents.actorUserId, user.id), eq(auditEvents.orgId, primaryOrg.id))
    : eq(auditEvents.actorUserId, user.id);

  const remoteEvents = await goRequest<{
    events: Array<AuditRow & { createdAt: string }>;
  }>(user, "/api/v1/audit?limit=100");
  const events: AuditRow[] = remoteEvents
    ? remoteEvents.events.map((e) => ({
        ...e,
        createdAt: new Date(e.createdAt),
      }))
    : hasRemoteDatabase()
      ? await db
          .select({
            id: auditEvents.id,
            event: auditEvents.event,
            createdAt: auditEvents.createdAt,
            actorUserId: auditEvents.actorUserId,
            orgId: auditEvents.orgId,
            resourceType: auditEvents.resourceType,
            resourceId: auditEvents.resourceId,
            ip: auditEvents.ip,
            userAgent: auditEvents.userAgent,
            metadata: auditEvents.metadata,
          })
          .from(auditEvents)
          .where(orgFilter)
          .orderBy(desc(auditEvents.createdAt))
          .limit(100)
      : await readLabEvents();

  const remoteMembers = primaryOrg
    ? await listOrgMembers(primaryOrg.id, user)
    : null;
  if (remoteMembers) {
    members = remoteMembers;
  } else if (primaryOrg && hasRemoteDatabase()) {
    members = await db
      .select({
        userId: memberships.userId,
        email: users.email,
        name: users.name,
        role: memberships.role,
      })
      .from(memberships)
      .innerJoin(users, eq(users.id, memberships.userId))
      .where(eq(memberships.orgId, primaryOrg.id));
  } else if (primaryOrg) {
    members = (await listLabMembers(primaryOrg.id)).map((m) => ({
      userId: m.userId,
      email: m.email,
      name: m.name,
      role: m.role,
    }));
  }

  const canAdmin =
    primaryOrg &&
    (primaryOrg.role === "owner" || primaryOrg.role === "admin");

  const report = buildSecurityReport({
    events,
    hasOrg: orgs.length > 0,
    memberCount: members.length || (primaryOrg ? 1 : 0),
    role: primaryOrg?.role ?? null,
  });

  const issuedAt = new Date().toISOString();

  return (
    <div className="mx-auto w-full max-w-3xl flex-1 px-6 py-12">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="font-mono text-xs font-medium uppercase tracking-[0.14em] text-accent">
            Cybersecurity education report card
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight">
            Security X-ray
          </h1>
          <p className="mt-2 text-muted">
            {user.email}
            {user.name ? ` · ${user.name}` : ""}
          </p>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-2">
          <Link
            href="/app/scans"
            className="border border-line px-4 py-2 text-sm hover:border-foreground"
          >
            Repo scans →
          </Link>
          <form action={logoutAction}>
            <button
              type="submit"
              className="border border-line px-4 py-2 text-sm hover:border-foreground"
            >
              Sign out
            </button>
          </form>
        </div>
      </div>

      <section className="mt-10 border border-line bg-surface px-6 py-6">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.14em] text-muted">
              Report grade
            </p>
            <p className="mt-2 font-mono text-6xl font-semibold leading-none text-accent">
              {report.grade}
            </p>
            <p className="mt-3 max-w-md text-[15px] leading-7 text-muted">
              {report.label}
            </p>
          </div>
          <div className="text-right">
            <p className="font-mono text-3xl font-semibold tabular-nums">
              {report.score}
              <span className="text-lg text-muted">/100</span>
            </p>
            <p className="mt-1 font-mono text-xs text-muted">
              {report.completed}/{report.total} controls complete
            </p>
            <p className="mt-3 font-mono text-[10px] text-muted">
              snapshot {issuedAt}
            </p>
          </div>
        </div>
        <div className="mt-6 h-2 w-full bg-white">
          <div
            className="h-2 bg-accent transition-all"
            style={{ width: `${report.score}%` }}
          />
        </div>
        <p className="mt-4 text-sm leading-7 text-muted">
          This panel is a{" "}
          <strong className="font-medium text-foreground">
            cybersecurity education lab
          </strong>
          : every step is bound to live audit evidence. Not a prompt — enforced
          controls.
        </p>
        <p className="mt-3 font-mono text-[11px] leading-5 text-muted">
          {hasDurableStore()
            ? "Evidence is read from the Go API / Postgres audit_events."
            : "Evidence is a signed HttpOnly lab cookie until the Go API or DATABASE_URL is connected. Create an org and invite a member to raise this grade to A."}
        </p>
      </section>

      <Suspense
        fallback={
          <p className="mt-10 font-mono text-xs text-muted">
            Binding private channel…
          </p>
        }
      >
        <ChannelSessionPanel />
      </Suspense>

      <section className="mt-12 border-t border-line pt-10">
        <h2 className="text-xl font-semibold">Training steps (X-ray)</h2>
        <p className="mt-2 text-[16px] leading-7 text-muted">
          Completed steps are read from the audit trail. Gaps are your next lab
          assignment.
        </p>
        <ol className="mt-8 space-y-4">
          {report.steps.map((step) => (
            <li
              key={step.id}
              className="border border-line px-4 py-4"
              style={{
                background: step.done ? "var(--surface)" : "transparent",
              }}
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="font-mono text-xs text-accent">
                    {step.done ? "PASS" : "TODO"} · {step.control}
                  </p>
                  <h3 className="mt-1 text-base font-semibold">{step.title}</h3>
                  <p className="mt-2 text-[15px] leading-7 text-muted">
                    {step.lesson}
                  </p>
                </div>
                <span
                  className="shrink-0 font-mono text-xs"
                  style={{ color: step.done ? "var(--accent)" : "var(--muted)" }}
                >
                  {step.done ? "● done" : "○ pending"}
                </span>
              </div>
              <p className="mt-3 font-mono text-[11px] text-muted">
                evidence: {step.evidenceEvent ?? "—"}
                {step.at ? ` · ${step.at.toISOString()}` : ""}
              </p>
            </li>
          ))}
        </ol>
      </section>

      <section className="mt-12 border-t border-line pt-10">
        <h2 className="text-xl font-semibold">Event frequency</h2>
        <p className="mt-2 text-[16px] leading-7 text-muted">
          Audit event distribution — a behavior X-ray.
        </p>
        {Object.keys(report.eventCounts).length === 0 ? (
          <p className="mt-6 text-sm text-muted">
            No events yet. Start with the login handshake.
          </p>
        ) : (
          <ul className="mt-6 grid gap-2 sm:grid-cols-2">
            {Object.entries(report.eventCounts)
              .sort((a, b) => b[1] - a[1])
              .map(([name, count]) => (
                <li
                  key={name}
                  className="flex items-center justify-between border border-line bg-surface px-4 py-3 font-mono text-xs"
                >
                  <span className="text-accent">{name}</span>
                  <span className="tabular-nums">{count}</span>
                </li>
              ))}
          </ul>
        )}
      </section>

      <LiveAuditTimeline
        orgAuditHref={
          primaryOrg ? `/app/org/${primaryOrg.id}/audit` : null
        }
      />

      <section className="mt-12 border-t border-line pt-10">
        <h2 className="text-xl font-semibold">Lab assignments</h2>
        <p className="mt-2 text-[16px] leading-7 text-muted">
          Raise your grade by exercising these controls — each one writes an
          audit event.
        </p>

        <div className="mt-8 space-y-8">
          <div>
            <h3 className="text-sm font-semibold">Organization</h3>
            {orgs.length === 0 ? (
              <div className="mt-3">
                <p className="text-sm text-muted">
                  No organization yet — create a tenant boundary.
                </p>
                <CreateOrgForm />
              </div>
            ) : (
              <ul className="mt-3 space-y-2">
                {orgs.map((org) => (
                  <li
                    key={org.id}
                    className="flex items-center justify-between border border-line bg-surface px-4 py-3"
                  >
                    <div>
                      <p className="font-medium">{org.name}</p>
                      <p className="font-mono text-xs text-muted">
                        {org.slug} · {org.role}
                      </p>
                    </div>
                    <Link
                      href={`/app/org/${org.id}/audit`}
                      className="text-sm underline"
                    >
                      Audit
                    </Link>
                  </li>
                ))}
              </ul>
            )}
            {orgs.length > 0 ? (
              <div className="mt-4">
                <p className="text-sm font-semibold">New organization</p>
                <CreateOrgForm />
              </div>
            ) : null}
          </div>

          {primaryOrg ? (
            <div>
              <h3 className="text-sm font-semibold">
                Members · {primaryOrg.name}
              </h3>
              <ul className="mt-3 space-y-2">
                {members.map((m) => (
                  <li
                    key={m.userId}
                    className="flex justify-between border border-line px-4 py-2 text-sm"
                  >
                    <span>{m.email ?? m.name ?? m.userId}</span>
                    <span className="font-mono text-xs text-muted">{m.role}</span>
                  </li>
                ))}
              </ul>
              {canAdmin ? (
                <div className="mt-4">
                  <p className="text-sm font-semibold">
                    Invite member (RBAC drill)
                  </p>
                  <InviteMemberForm orgId={primaryOrg.id} />
                </div>
              ) : null}
            </div>
          ) : null}
        </div>
      </section>

      <section className="mt-12 border-t border-line pt-8 pb-4">
        <p className="font-mono text-[11px] leading-5 text-muted">
          cursor security education · masterfabric-next-sec · ASVS L2 lab · not a live
          pen-test report; this is a learning report card.
        </p>
      </section>
    </div>
  );
}
