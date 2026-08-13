"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

async function postScan(body: Record<string, unknown>) {
  const res = await fetch("/api/scans", {
    method: "POST",
    credentials: "same-origin",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(body),
  });
  const payload = (await res.json()) as {
    id?: string;
    grade?: string;
    overallScore?: number;
    error?: { message?: string };
  };
  if (!res.ok) {
    throw new Error(payload.error?.message ?? "Scan failed.");
  }
  return payload;
}

export function ScanIngestForm({ defaultLabel }: { defaultLabel?: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);
  const [label, setLabel] = useState(defaultLabel ?? "cursor-security");

  function finish(
    body: { id?: string; grade?: string; overallScore?: number },
    kind: "lab" | "paste",
  ) {
    setOk(
      `${kind === "lab" ? "Lab scan" : "Report"} saved · grade ${body.grade} · ${body.overallScore}/100`,
    );
    router.refresh();
  }

  return (
    <div className="mt-6 space-y-6">
      <label className="block text-sm">
        <span className="text-muted">Project label</span>
        <input
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          className="mt-1 w-full border border-line bg-transparent px-3 py-2"
          placeholder="cursor-security"
        />
      </label>

      <div>
        <button
          type="button"
          disabled={pending}
          onClick={() => {
            setError(null);
            setOk(null);
            startTransition(async () => {
              try {
                const body = await postScan({
                  demo: true,
                  projectLabel: label.trim() || "cursor-security",
                  source: "ui",
                });
                finish(body, "lab");
              } catch (err) {
                setError(err instanceof Error ? err.message : "Scan failed.");
              }
            });
          }}
          className="h-10 bg-foreground px-4 text-sm text-white disabled:opacity-50"
        >
          {pending ? "Scanning…" : "Run lab scan"}
        </button>
        <p className="mt-2 text-[13px] leading-6 text-muted">
          Writes a compact report of this live control surface — persistence,
          email, and JWT gaps — without pasting JSON.
        </p>
      </div>

      <form
        className="border-t border-line pt-5"
        onSubmit={(e) => {
          e.preventDefault();
          const form = new FormData(e.currentTarget);
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
              const body = await postScan({
                report,
                projectLabel: label.trim() || undefined,
                source: "ui",
              });
              finish(body, "paste");
            } catch (err) {
              setError(
                err instanceof Error ? err.message : "Could not save that JSON.",
              );
            }
          });
        }}
      >
        <p className="text-sm font-medium">Paste an MCP report</p>
        <p className="mt-1 text-[13px] leading-6 text-muted">
          Optional. From Cursor run{" "}
          <code className="font-mono text-xs">security_scan_full</code>, or{" "}
          <code className="font-mono text-xs">
            npm run scan -w @cursor-security/mcp -- --format json
          </code>
          .
        </p>
        <textarea
          name="report"
          rows={8}
          className="mt-3 w-full border border-line bg-transparent px-3 py-2 font-mono text-xs"
          placeholder='{ "overallScore": 82, "grade": "B", "summary": "...", "findings": [] }'
        />
        <button
          type="submit"
          disabled={pending}
          className="mt-3 h-9 border border-line px-4 text-sm hover:border-foreground disabled:opacity-50"
        >
          {pending ? "Saving…" : "Save pasted report"}
        </button>
      </form>

      {error ? <p className="text-sm text-red-700">{error}</p> : null}
      {ok ? <p className="text-sm text-accent">{ok}</p> : null}
    </div>
  );
}
