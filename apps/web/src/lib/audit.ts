import { createAuditWriter, type AuditEventInput } from "masterfabric-next-sec/audit";
import { db } from "@/db";
import { hasRemoteDatabase } from "@/lib/db-mode";
import { auditEvents } from "@/db/schema";

export const audit = createAuditWriter(async (event: AuditEventInput) => {
  if (!hasRemoteDatabase()) return;
  try {
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
  } catch (error) {
    console.error("audit write failed", error);
  }
});
