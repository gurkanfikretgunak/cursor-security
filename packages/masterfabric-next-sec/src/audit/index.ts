export const AUDIT_EVENTS = [
  "auth.handshake",
  "auth.device",
  "auth.channel",
  "auth.blended",
  "auth.channel_access",
  "auth.channel_denied",
  "auth.login",
  "auth.logout",
  "auth.failure",
  "rbac.denied",
  "org.created",
  "org.member_added",
  "org.member_removed",
  "org.role_changed",
  "admin.action",
  "data.export",
  "security.scan.ingested",
] as const;

export type AuditEventName = (typeof AUDIT_EVENTS)[number];

export type AuditEventInput = {
  event: AuditEventName;
  actorUserId?: string | null;
  orgId?: string | null;
  resourceType?: string | null;
  resourceId?: string | null;
  ip?: string | null;
  userAgent?: string | null;
  metadata?: Record<string, unknown>;
};

export type AuditEventRecord = AuditEventInput & {
  id: string;
  createdAt: Date;
};

export type AuditWriter = {
  write(event: AuditEventInput): Promise<void>;
};

export function createAuditWriter(
  insert: (event: AuditEventInput) => Promise<void>,
): AuditWriter {
  return {
    async write(event) {
      await insert({
        ...event,
        metadata: event.metadata ?? {},
      });
    },
  };
}

export function isAuditEventName(value: string): value is AuditEventName {
  return (AUDIT_EVENTS as readonly string[]).includes(value);
}
