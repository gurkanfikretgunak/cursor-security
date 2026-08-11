import { createAuditWriter, type AuditEventInput } from "masterfabric-next-sec/audit";
import { db } from "@/db";
import { auditEvents } from "@/db/schema";

export const audit = createAuditWriter(async (event: AuditEventInput) => {
  await db.insert(auditEvents).values({
    event: event.event,
    actorUserId: event.actorUserId ?? null,
    orgId: event.orgId ?? null,
    resourceType: event.resourceType ?? null,
    resourceId: event.resourceId ?? null,
    ip: event.ip ?? null,
    userAgent: event.userAgent ?? null,
    metadata: event.metadata ?? {},
  });
});
