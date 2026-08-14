import { createAuditWriter, type AuditEventInput } from "masterfabric-next-sec/audit";
import { db } from "@/db";
import { hasRemoteDatabase } from "@/lib/db-mode";
import { goRequest } from "@/lib/go-backend";
import { appendLabEvent } from "@/lib/lab-store";
import { auditEvents } from "@/db/schema";

export const audit = createAuditWriter(async (event: AuditEventInput) => {
  try {
    if (event.actorUserId) {
      const email = event.actorUserId.startsWith("test:")
        ? event.actorUserId.slice(5)
        : undefined;
      const remote = await goRequest<{ id: string }>(
        { id: event.actorUserId, email },
        "/api/v1/audit",
        {
          method: "POST",
          body: JSON.stringify({
            event: event.event,
            orgId: event.orgId ?? null,
            resourceType: event.resourceType ?? null,
            resourceId: event.resourceId ?? null,
            ip: event.ip ?? null,
            userAgent: event.userAgent ?? null,
            metadata: event.metadata ?? {},
          }),
        },
      );
      if (remote) return;
    }
    if (hasRemoteDatabase()) {
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
      return;
    }
    await appendLabEvent(event);
  } catch (error) {
    console.error("audit write failed", error);
  }
});
