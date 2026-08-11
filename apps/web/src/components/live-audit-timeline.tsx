"use client";

import { useCallback, useEffect, useState } from "react";

export type LiveAuditEvent = {
  id: string;
  event: string;
  label: string;
  createdAt: string;
  actorUserId: string | null;
  orgId: string | null;
  resourceType: string | null;
  resourceId: string | null;
  ip: string | null;
  metadata: Record<string, unknown> | null;
};

type FeedResponse = {
  fetchedAt: string;
  count: number;
  events: LiveAuditEvent[];
  error?: { message?: string };
};

const SPEED_OPTIONS = [
  { label: "Off", seconds: 0 },
  { label: "1s", seconds: 1 },
  { label: "2s", seconds: 2 },
  { label: "3s", seconds: 3 },
  { label: "5s", seconds: 5 },
  { label: "10s", seconds: 10 },
  { label: "15s", seconds: 15 },
  { label: "30s", seconds: 30 },
] as const;

const STORAGE_KEY = "cursor-security.auditRefreshSeconds";

function readStoredSeconds(): number {
  if (typeof window === "undefined") return 5;
  const raw = localStorage.getItem(STORAGE_KEY);
  const n = raw == null ? 5 : Number(raw);
  if (!Number.isFinite(n) || n < 0) return 5;
  return Math.min(60, Math.floor(n));
}

export function LiveAuditTimeline({
  orgAuditHref,
}: {
  orgAuditHref?: string | null;
}) {
  const [seconds, setSeconds] = useState(5);
  const [custom, setCustom] = useState("5");
  const [events, setEvents] = useState<LiveAuditEvent[]>([]);
  const [fetchedAt, setFetchedAt] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const initial = readStoredSeconds();
    setSeconds(initial);
    setCustom(String(initial || 5));
  }, []);

  const applySeconds = useCallback((value: number) => {
    const next = Math.min(60, Math.max(0, Math.floor(value)));
    setSeconds(next);
    localStorage.setItem(STORAGE_KEY, String(next));
    if (next > 0) setCustom(String(next));
  }, []);

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
      setTick((t) => t + 1);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Audit feed error.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (seconds <= 0) return;
    const id = window.setInterval(() => {
      void load();
    }, seconds * 1000);
    return () => window.clearInterval(id);
  }, [seconds, load]);

  return (
    <section className="mt-12 border-t border-line pt-10">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold">Full audit timeline</h2>
          <p className="mt-2 text-[16px] leading-7 text-muted">
            Live feed (last 100). Refresh speed is configurable in seconds.
          </p>
        </div>
        {orgAuditHref ? (
          <a href={orgAuditHref} className="shrink-0 text-sm underline">
            Org audit →
          </a>
        ) : null}
      </div>

      <div className="mt-6 border border-line bg-surface px-4 py-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="font-mono text-xs uppercase tracking-[0.14em] text-accent">
            Audit speed
          </p>
          <p className="font-mono text-[11px] text-muted">
            {seconds === 0
              ? "auto-refresh off"
              : `every ${seconds}s · tick #${tick}`}
            {loading ? " · fetching…" : ""}
          </p>
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          {SPEED_OPTIONS.map((opt) => (
            <button
              key={opt.label}
              type="button"
              onClick={() => applySeconds(opt.seconds)}
              className="h-8 border px-3 font-mono text-xs"
              style={{
                borderColor:
                  seconds === opt.seconds ? "var(--foreground)" : "var(--line)",
                background:
                  seconds === opt.seconds ? "var(--foreground)" : "white",
                color: seconds === opt.seconds ? "white" : "var(--foreground)",
              }}
            >
              {opt.label}
            </button>
          ))}
        </div>

        <form
          className="mt-3 flex flex-wrap items-center gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            const n = Number(custom);
            if (!Number.isFinite(n)) return;
            applySeconds(n);
          }}
        >
          <label className="font-mono text-xs text-muted">
            Custom seconds (1–60)
            <input
              type="number"
              min={1}
              max={60}
              value={custom}
              onChange={(e) => setCustom(e.target.value)}
              className="ml-2 w-20 border border-line bg-white px-2 py-1 text-foreground outline-none focus:border-foreground"
            />
          </label>
          <button
            type="submit"
            className="h-8 border border-line px-3 font-mono text-xs hover:border-foreground"
          >
            Apply
          </button>
          <button
            type="button"
            onClick={() => void load()}
            className="h-8 bg-foreground px-3 font-mono text-xs text-white"
          >
            Refresh now
          </button>
        </form>

        {fetchedAt ? (
          <p className="mt-3 font-mono text-[11px] text-muted">
            last fetch {fetchedAt}
          </p>
        ) : null}
        {error ? (
          <p className="mt-2 text-sm text-red-700">{error}</p>
        ) : null}
      </div>

      <ul className="mt-8 space-y-3">
        {events.length === 0 ? (
          <li className="text-sm text-muted">No records.</li>
        ) : (
          events.map((e, index) => (
            <li key={e.id} className="border border-line px-4 py-3">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <p className="font-mono text-xs text-muted">
                  #{String(events.length - index).padStart(3, "0")}
                </p>
                <p className="font-mono text-[11px] text-muted">
                  {e.createdAt}
                </p>
              </div>
              <p className="mt-1 font-mono text-sm text-accent">{e.event}</p>
              <p className="mt-1 text-sm text-foreground">{e.label}</p>
              <pre className="mt-2 overflow-x-auto font-mono text-[11px] leading-5 text-muted">
                {JSON.stringify(
                  {
                    actorUserId: e.actorUserId,
                    orgId: e.orgId,
                    resourceType: e.resourceType,
                    resourceId: e.resourceId,
                    ip: e.ip,
                    metadata: e.metadata,
                  },
                  null,
                  2,
                )}
              </pre>
            </li>
          ))
        )}
      </ul>
    </section>
  );
}
