"use client";

import { useState } from "react";
import {
  auditDetailParts,
  auditFacts,
  auditFamily,
  formatRelativeTime,
} from "@/lib/format";

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
  userAgent?: string | null;
  metadata?: Record<string, unknown> | null;
};

function familyLabel(event: string): string {
  const family = auditFamily(event);
  if (family === "auth") return "Auth";
  if (family === "org") return "Org";
  if (family === "scan") return "Scan";
  return "Event";
}

function AuditEventRow({
  item,
  now,
}: {
  item: AuditListItem;
  now?: number;
}) {
  const [open, setOpen] = useState(false);
  const summary = auditDetailParts(item);
  const facts = auditFacts(item);

  return (
    <li className="relative py-3.5">
      <span
        className="absolute -left-[23px] top-[22px] h-2.5 w-2.5 rounded-full bg-accent"
        aria-hidden
      />
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="flex w-full items-start justify-between gap-4 text-left"
        aria-expanded={open}
      >
        <div className="min-w-0">
          <p className="font-medium leading-6">{item.label}</p>
          <p className="mt-1 font-mono text-[11px] text-muted">
            {familyLabel(item.event)} · {item.event}
            {facts.length > 0 ? (open ? " · hide detail" : " · expand") : ""}
          </p>
          {!open && summary.length > 0 ? (
            <p className="mt-1 truncate text-[13px] leading-6 text-muted">
              {summary.join(" · ")}
            </p>
          ) : null}
        </div>
        <time
          className="shrink-0 font-mono text-[11px] tabular-nums text-muted"
          dateTime={item.createdAt}
        >
          {formatRelativeTime(item.createdAt, now)}
        </time>
      </button>
      {open && facts.length > 0 ? (
        <dl className="mt-3 grid gap-2 border border-line bg-surface px-3 py-3 sm:grid-cols-[7.5rem_1fr]">
          {facts.map((fact) => (
            <div key={`${item.id}-${fact.label}`} className="contents">
              <dt className="font-mono text-[11px] uppercase tracking-[0.08em] text-muted">
                {fact.label}
              </dt>
              <dd className="break-all font-mono text-[12px] leading-5 text-foreground">
                {fact.value}
              </dd>
            </div>
          ))}
        </dl>
      ) : null}
      {open && facts.length === 0 ? (
        <p className="mt-2 text-[13px] text-muted">No extra fields on this event.</p>
      ) : null}
    </li>
  );
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
      {events.map((item) => (
        <AuditEventRow key={item.id} item={item} now={now} />
      ))}
    </ol>
  );
}
