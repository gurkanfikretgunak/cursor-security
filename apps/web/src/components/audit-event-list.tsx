import { auditDetailParts, auditFamily, formatRelativeTime } from "@/lib/format";

export type AuditListItem = {
  id: string;
  event: string;
  label: string;
  createdAt: string;
  actorUserId?: string | null;
  orgId?: string | null;
  resourceType?: string | null;
  resourceId?: string | null;
  ip?: string | null;
  metadata?: Record<string, unknown> | null;
};

function familyLabel(event: string): string {
  const family = auditFamily(event);
  if (family === "auth") return "Auth";
  if (family === "org") return "Org";
  if (family === "scan") return "Scan";
  return "Event";
}

export function AuditEventList({
  events,
  now,
}: {
  events: AuditListItem[];
  now?: number;
}) {
  if (events.length === 0) {
    return <p className="text-sm text-muted">No events yet.</p>;
  }

  return (
    <ol className="relative space-y-0 border-l border-line pl-5">
      {events.map((item) => {
        const details = auditDetailParts(item);
        return (
          <li key={item.id} className="relative py-3.5">
            <span
              className="absolute -left-[23px] top-[22px] h-2.5 w-2.5 rounded-full bg-accent"
              aria-hidden
            />
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="font-medium leading-6">{item.label}</p>
                <p className="mt-1 font-mono text-[11px] text-muted">
                  {familyLabel(item.event)} · {item.event}
                </p>
                {details.length > 0 ? (
                  <p className="mt-1 text-[13px] leading-6 text-muted">
                    {details.join(" · ")}
                  </p>
                ) : null}
              </div>
              <time
                className="shrink-0 font-mono text-[11px] tabular-nums text-muted"
                dateTime={item.createdAt}
              >
                {formatRelativeTime(item.createdAt, now)}
              </time>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
