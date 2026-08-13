"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

type BindResult = {
  deviceId: string;
  channelId: string;
  channelPath: string;
  handshakeId: string;
};

type ProbeResult = {
  ok: boolean;
  phase?: string;
  channelId?: string;
  deviceId?: string;
  userId?: string;
  message?: string;
  error?: { message?: string };
};

const HS_KEY = "cursor-security.handshakeId";
const CH_KEY = "cursor-security.channelPath";

export function ChannelSessionPanel() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [bind, setBind] = useState<BindResult | null>(null);
  const [probe, setProbe] = useState<ProbeResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const run = useCallback(async () => {
    setBusy(true);
    setError(null);
    try {
      // Prefer already-bound blended cookies when present.
      const statusRes = await fetch("/api/auth/channel-status", {
        credentials: "same-origin",
        headers: { Accept: "application/json" },
      });
      if (statusRes.ok) {
        const statusBody = (await statusRes.json()) as BindResult & {
          ok?: boolean;
        };
        setBind(statusBody);
        sessionStorage.setItem(HS_KEY, statusBody.handshakeId);
        sessionStorage.setItem(CH_KEY, statusBody.channelPath);
        const meRes = await fetch(statusBody.channelPath, {
          credentials: "same-origin",
          headers: { Accept: "application/json" },
        });
        const meBody = (await meRes.json()) as ProbeResult;
        setProbe(meBody);
        if (!meRes.ok) {
          throw new Error(meBody.error?.message ?? "Channel probe failed.");
        }
        router.refresh();
        return;
      }

      const fromQuery = searchParams.get("hid");
      const handshakeId =
        fromQuery ??
        (typeof window !== "undefined"
          ? sessionStorage.getItem(HS_KEY)
          : null);

      if (!handshakeId) {
        setError(
          "No handshake id in session. Sign out and complete login handshake again.",
        );
        return;
      }

      const bindRes = await fetch("/api/auth/bind", {
        method: "POST",
        credentials: "same-origin",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({ handshakeId }),
      });
      const bindBody = (await bindRes.json()) as
        | BindResult
        | { error?: { message?: string } };
      if (!bindRes.ok || !("channelPath" in bindBody)) {
        throw new Error(
          ("error" in bindBody && bindBody.error?.message) ||
            "Failed to bind blended session.",
        );
      }

      setBind(bindBody);
      sessionStorage.setItem(HS_KEY, bindBody.handshakeId);
      sessionStorage.setItem(CH_KEY, bindBody.channelPath);

      const meRes = await fetch(bindBody.channelPath, {
        method: "GET",
        credentials: "same-origin",
        headers: { Accept: "application/json" },
      });
      const meBody = (await meRes.json()) as ProbeResult;
      setProbe(meBody);
      if (!meRes.ok) {
        throw new Error(meBody.error?.message ?? "Channel probe failed.");
      }

      if (fromQuery) {
        router.replace("/app");
      }
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Channel bind failed.");
    } finally {
      setBusy(false);
    }
  }, [router, searchParams]);

  useEffect(() => {
    // Bind channel session after login when query tokens are present.
    // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional mount bind
    void run();
  }, [run]);

  return (
    <section className="mt-10 border border-line px-5 py-5">
      <p className="font-mono text-xs uppercase tracking-[0.14em] text-accent">
        Private channel
      </p>
      <h2 className="mt-2 text-lg font-semibold">
        Device JWT · blended JWT · barrier
      </h2>
      <p className="mt-2 text-[15px] leading-7 text-muted">
        After login, your anonymous device JWT is blended with the barrier key
        into a user-bound token. API calls only succeed on your personal{" "}
        <code className="font-mono text-sm">/api/c/&lt;channel&gt;/…</code> path.
      </p>

      <div className="mt-4 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => void run()}
          disabled={busy}
          className="h-10 bg-foreground px-4 text-sm font-medium text-white disabled:opacity-60"
        >
          {busy ? "Binding…" : "Re-bind / probe channel"}
        </button>
      </div>

      {error ? (
        <p className="mt-4 border border-line px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      ) : null}

      {bind ? (
        <dl className="mt-5 space-y-2 font-mono text-xs">
          <div className="flex flex-wrap gap-2 border border-line bg-surface px-3 py-2">
            <dt className="text-muted">deviceId</dt>
            <dd>{bind.deviceId}</dd>
          </div>
          <div className="flex flex-wrap gap-2 border border-line bg-surface px-3 py-2">
            <dt className="text-muted">channelId</dt>
            <dd>{bind.channelId}</dd>
          </div>
          <div className="flex flex-wrap gap-2 border border-line bg-surface px-3 py-2">
            <dt className="text-muted">channelPath</dt>
            <dd className="break-all text-accent">{bind.channelPath}</dd>
          </div>
        </dl>
      ) : null}

      {probe?.ok ? (
        <pre className="mt-4 overflow-x-auto border border-line bg-surface px-3 py-3 font-mono text-[11px] text-muted">
          {JSON.stringify(probe, null, 2)}
        </pre>
      ) : null}
    </section>
  );
}
