"use client";

import { useEffect, useState } from "react";

type BackendStatusResponse = {
  ok?: boolean;
  service?: string;
  database?: string;
  backend?: string;
};

export function BackendStatus() {
  const [label, setLabel] = useState("connecting…");

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      try {
        const response = await fetch("/api/backend-status", {
          cache: "no-store",
        });
        const body = (await response.json()) as BackendStatusResponse;
        if (cancelled) return;
        if (body.ok) {
          setLabel(`Backend up · db ${body.database ?? "unknown"}`);
          return;
        }
        setLabel("Backend waking or unreachable");
      } catch {
        if (!cancelled) setLabel("Backend unreachable");
      }
    };
    void run();
    return () => {
      cancelled = true;
    };
  }, []);

  return <p className="mt-6 font-mono text-xs text-muted">{label}</p>;
}
