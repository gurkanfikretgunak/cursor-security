"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AuditEventList, type AuditListItem } from "@/components/audit-event-list";
import { auditFamily, formatRelativeTime } from "@/lib/format";

type FeedResponse = {
  fetchedAt: string;
  count: number;
  events: AuditListItem[];
  error?: { message?: string };
};

type Filter = "all" | "auth" | "org" | "scan";

const FILTERS: Array<{ id: Filter; label: string }> = [
  { id: "all", label: "All" },
  { id: "auth", label: "Auth" },
  { id: "org", label: "Org" },
  { id: "scan", label: "Scan" },
];

const LIVE_SECONDS = 8;
const STORAGE_KEY = "cursor-security.auditLive";

function readLive(): boolean {
  if (typeof window === "undefined") return true;
  const raw = localStorage.getItem(STORAGE_KEY);
  if (raw == null) return true;
  return raw !== "0";
}

export function LiveAuditTimeline({
  orgAuditHref,
}: {
  orgAuditHref?: string | null;
}) {
  const [live, setLive] = useState(true);
  const [filter, setFilter] = useState<Filter>("all");
  const [events, setEvents] = useState<AuditListItem[]>([]);
  const [fetchedAt, setFetchedAt] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [now, setNow] = useState(() => Date.now());

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/audit/feed?limit=100", {
        credentials: "same-origin",
        headers: { Accept: "application/json" },
        cache: "no-store",
      });
      const body = (await res.json()) as FeedResponse;
      if (!res.ok) {
        throw new Error(body.error?.message ?? "Failed to load audit feed.");
      }
      setEvents(body.events);
      setFetchedAt(body.fetchedAt);
      setError(null);
      setNow(Date.now());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Audit feed error.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Restore live toggle and fetch the audit feed on mount.
    // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional mount sync
    setLive(readLive());
    void load();
  }, [load]);

  useEffect(() => {
    if (!live) return;
    const id = window.setInterval(() => {
      void load();
    }, LIVE_SECONDS * 1000);
    return () => window.clearInterval(id);
  }, [live, load]);

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 15_000);
    return () => window.clearInterval(id);
  }, []);

  const visible = useMemo(() => {
    if (filter === "all") return events;
    return events.filter((e) => auditFamily(e.event) === filter);
  }, [events, filter]);

  const counts = useMemo(() => {
    const next = { all: events.length, auth: 0, org: 0, scan: 0 };
    for (const e of events) {
      const family = auditFamily(e.event);
      if (family === "auth" || family === "org" || family === "scan") {
        next[family] += 1;
      }
    }
    return next;
  }, [events]);

  function toggleLive(next: boolean) {
    setLive(next);
    localStorage.setItem(STORAGE_KEY, next ? "1" : "0");
  }

  return (
    <section className="mt-12 border-t border-line pt-10">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold">Full audit timeline</h2>
          <p className="mt-2 text-[16px] leading-7 text-muted">
            Newest first. Human labels, not raw JSON.
          </p>
        </div>
        {orgAuditHref ? (
          <a href={orgAuditHref} className="shrink-0 text-sm underline">
            Org audit →
          </a>
        ) : null}
      </div>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
        <p className="font-mono text-[11px] text-muted">
          {events.length} event{events.length === 1 ? "" : "s"}
          {fetchedAt ? ` · updated ${formatRelativeTime(fetchedAt, now)}` : ""}
          {loading ? " · fetching" : ""}
        </p>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => toggleLive(!live)}
            className="h-8 border px-3 font-mono text-xs"
            style={{
              borderColor: live ? "var(--foreground)" : "var(--line)",
              background: live ? "var(--foreground)" : "white",
              color: live ? "white" : "var(--foreground)",
            }}
          >
            {live ? "Live" : "Paused"}
          </button>
          <button
            type="button"
            onClick={() => void load()}
            className="h-8 border border-line px-3 font-mono text-xs hover:border-foreground"
          >
            Refresh
          </button>
        </div>
      </div>

      {error ? <p className="mt-3 text-sm text-red-700">{error}</p> : null}

      <div className="mt-5 flex flex-wrap gap-2">
        {FILTERS.map((opt) => {
          const active = filter === opt.id;
          const count = counts[opt.id];
          return (
            <button
              key={opt.id}
              type="button"
              onClick={() => setFilter(opt.id)}
              className="h-8 border px-3 font-mono text-xs"
              style={{
                borderColor: active ? "var(--foreground)" : "var(--line)",
                background: active ? "var(--foreground)" : "white",
                color: active ? "white" : "var(--foreground)",
              }}
            >
              {opt.label}
              {count > 0 ? ` ${count}` : ""}
            </button>
          );
        })}
      </div>

      <div className="mt-6">
        {events.length === 0 ? (
          <p className="text-sm text-muted">
            No records yet. Sign in, create an org, or run a repo scan.
          </p>
        ) : visible.length === 0 ? (
          <p className="text-sm text-muted">
            No {filter} events in this feed.
          </p>
        ) : (
          <AuditEventList events={visible} now={now} />
        )}
      </div>
    </section>
  );
}
