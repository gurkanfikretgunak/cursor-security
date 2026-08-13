"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

export function ScanIngestForm() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);

  return (
    <form
      className="mt-6 space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        const form = new FormData(e.currentTarget);
        const label = String(form.get("projectLabel") ?? "").trim();
        const raw = String(form.get("report") ?? "").trim();
        setError(null);
        setOk(null);
        startTransition(async () => {
          try {
            const parsed = JSON.parse(raw) as {
              report?: unknown;
              overallScore?: number;
            };
            const report =
              parsed && typeof parsed === "object" && "report" in parsed
                ? (parsed as { report: Record<string, unknown> }).report
                : parsed;
            const res = await fetch("/api/scans", {
              method: "POST",
              credentials: "same-origin",
              headers: {
                "Content-Type": "application/json",
                Accept: "application/json",
              },
              body: JSON.stringify({
                report,
                projectLabel: label || undefined,
                source: "ui",
              }),
            });
            const body = (await res.json()) as {
              id?: string;
              grade?: string;
              overallScore?: number;
              error?: { message?: string };
            };
            if (!res.ok) {
              throw new Error(body.error?.message ?? "Ingest failed.");
            }
            setOk(
              `Saved scan ${body.id} · grade ${body.grade} · ${body.overallScore}/100`,
            );
            router.refresh();
          } catch (err) {
            setError(err instanceof Error ? err.message : "Ingest failed.");
          }
        });
      }}
    >
      <label className="block text-sm">
        <span className="text-muted">Project label</span>
        <input
          name="projectLabel"
          className="mt-1 w-full border border-line bg-transparent px-3 py-2"
          placeholder="my-app"
        />
      </label>
      <label className="block text-sm">
        <span className="text-muted">
          MCP / CLI JSON report (paste full report or{" "}
          <code className="font-mono text-xs">{"{ report: ... }"}</code>)
        </span>
        <textarea
          name="report"
          required
          rows={12}
          className="mt-1 w-full border border-line bg-transparent px-3 py-2 font-mono text-xs"
          placeholder='{ "overallScore": 82, "grade": "B", "summary": "...", "findings": [] }'
        />
      </label>
      <button
        type="submit"
        disabled={pending}
        className="border border-line px-4 py-2 text-sm hover:border-foreground disabled:opacity-50"
      >
        {pending ? "Saving…" : "Ingest scan"}
      </button>
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      {ok ? <p className="text-sm text-muted">{ok}</p> : null}
    </form>
  );
}
