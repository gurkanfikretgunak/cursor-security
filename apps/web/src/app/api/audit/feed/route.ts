import { NextResponse } from "next/server";
import { desc, eq, or } from "drizzle-orm";
import { requireUser } from "masterfabric-next-sec/auth";
import { AppError, toPublicError } from "masterfabric-next-sec/errors";
import { auth } from "@/auth";
import { db } from "@/db";
import { auditEvents } from "@/db/schema";
import { listUserOrgs } from "@/lib/orgs";
import { describeAuditEvent } from "@/lib/security-report";

export async function GET(request: Request) {
  try {
    const session = await auth();
    const user = requireUser(session);
    const limitRaw = Number(
      new URL(request.url).searchParams.get("limit") ?? "100",
    );
    const limit = Math.min(100, Math.max(1, Number.isFinite(limitRaw) ? limitRaw : 100));

    const orgs = await listUserOrgs(user.id);
    const primaryOrg = orgs[0];
    const filter = primaryOrg
      ? or(
          eq(auditEvents.actorUserId, user.id),
          eq(auditEvents.orgId, primaryOrg.id),
        )
      : eq(auditEvents.actorUserId, user.id);

    const rows = await db
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
      .where(filter)
      .orderBy(desc(auditEvents.createdAt))
      .limit(limit);

    return NextResponse.json({
      fetchedAt: new Date().toISOString(),
      count: rows.length,
      events: rows.map((e) => ({
        ...e,
        createdAt: e.createdAt.toISOString(),
        label: describeAuditEvent(e.event),
      })),
    });
  } catch (error) {
    if (!(error instanceof AppError)) {
      // requireUser throws AppError
    }
    const pub = toPublicError(error);
    return NextResponse.json(
      { error: { code: pub.code, message: pub.message } },
      { status: pub.status },
    );
  }
}
