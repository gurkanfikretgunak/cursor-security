"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { removeScan } from "@/app/actions/scan";

export function ScanRemoveButton({
  scanId,
  canRemove,
}: {
  scanId: string;
  canRemove: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const title = canRemove
    ? "Remove scan"
    : "Only organization admins can remove scans";

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        aria-label={title}
        title={title}
        disabled={!canRemove || pending}
        onClick={() => {
          if (!canRemove) return;
          setError(null);
          startTransition(async () => {
            const result = await removeScan({ scanId }, {});
            if (result.ok) {
              router.refresh();
              return;
            }
            setError(result.error.message);
          });
        }}
        className="inline-flex h-8 w-8 items-center justify-center border border-line text-muted hover:border-foreground hover:text-foreground disabled:cursor-not-allowed disabled:opacity-35 disabled:hover:border-line disabled:hover:text-muted"
      >
        <svg
          aria-hidden="true"
          viewBox="0 0 16 16"
          className="h-3.5 w-3.5"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
        >
          <path d="M3 4.5h10M6 4.5V3.25h4V4.5M5 4.5l.4 8h5.2l.4-8" />
        </svg>
      </button>
      {error ? <p className="max-w-40 text-right text-xs text-red-700">{error}</p> : null}
    </div>
  );
}
