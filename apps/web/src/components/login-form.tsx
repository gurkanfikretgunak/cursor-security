"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import { requestMagicLink, requestTestLogin } from "@/app/actions/auth";

type Handshake = {
  handshakeId: string;
  expiresAt: number;
  deviceId: string;
  channelId: string;
  channelPath: string;
};

const HS_KEY = "cursor-security.handshakeId";
const CH_KEY = "cursor-security.channelPath";

async function fetchHandshake(): Promise<Handshake> {
  const res = await fetch("/api/auth/handshake", {
    method: "POST",
    credentials: "same-origin",
    headers: { Accept: "application/json" },
  });
  const body = (await res.json()) as
    | Handshake
    | { error?: { message?: string } };
  if (!res.ok || !("handshakeId" in body)) {
    throw new Error(
      ("error" in body && body.error?.message) ||
        "Could not start auth handshake.",
    );
  }
  return body;
}

export function LoginForm({ callbackUrl }: { callbackUrl?: string }) {
  const [handshake, setHandshake] = useState<Handshake | null>(null);
  const [preflight, setPreflight] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const refreshHandshake = useCallback(async () => {
    const next = await fetchHandshake();
    setHandshake(next);
    sessionStorage.setItem(HS_KEY, next.handshakeId);
    sessionStorage.setItem(CH_KEY, next.channelPath);

    // Device-only pre-auth channel probe
    const probe = await fetch(
      `${next.channelPath}?hid=${encodeURIComponent(next.handshakeId)}`,
      { credentials: "same-origin", headers: { Accept: "application/json" } },
    );
    const probeBody = (await probe.json()) as {
      ok?: boolean;
      message?: string;
      error?: { message?: string };
    };
    setPreflight(
      probe.ok
        ? probeBody.message ?? "Pre-auth channel OK"
        : probeBody.error?.message ?? "Pre-auth channel failed",
    );

    return next;
  }, []);

  useEffect(() => {
    // Bootstrap auth handshake cookie/channel on login page mount.
    // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional mount handshake
    refreshHandshake().catch((err: unknown) => {
      setError(err instanceof Error ? err.message : "Handshake failed.");
    });
  }, [refreshHandshake]);

  return (
    <form
      className="mt-8 space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        const form = new FormData(e.currentTarget);
        const email = String(form.get("email") ?? "");
        const password = String(form.get("password") ?? "");
        setMessage(null);
        setError(null);
        startTransition(async () => {
          try {
            let active = handshake;
            if (!active || Date.now() > active.expiresAt - 15_000) {
              active = await refreshHandshake();
            }

            if (password) {
              const result = await requestTestLogin(
                {
                  email,
                  password,
                  callbackUrl,
                  handshakeId: active.handshakeId,
                },
                {},
              );
              if (result.ok) {
                window.location.assign(result.data.redirectTo);
                return;
              }
              setError(result.error.message);
              await refreshHandshake().catch(() => undefined);
              return;
            }

            const result = await requestMagicLink(
              {
                email,
                callbackUrl,
                handshakeId: active.handshakeId,
              },
              {},
            );

            if (result.ok) {
              sessionStorage.setItem(HS_KEY, result.data.handshakeId);
              setMessage(result.data.hint);
            } else {
              setError(result.error.message);
              await refreshHandshake().catch(() => undefined);
            }
          } catch (err) {
            setError(err instanceof Error ? err.message : "Login failed.");
            await refreshHandshake().catch(() => undefined);
          }
        });
      }}
    >
      <label className="block text-sm text-muted">
        Work email
        <input
          name="email"
          type="email"
          required
          autoComplete="email"
          className="mt-2 block w-full border border-line bg-white px-3 py-2 text-foreground outline-none focus:border-foreground"
          placeholder="you@company.com"
        />
      </label>
      <label className="block text-sm text-muted">
        Test password
        <input
          name="password"
          type="password"
          required
          className="mt-2 block w-full border border-line bg-white px-3 py-2 text-foreground outline-none focus:border-foreground"
          placeholder="AUTH_TEST_PASSWORD"
        />
      </label>
      <div className="flex flex-wrap gap-3">
      <button
        type="submit"
        disabled={pending || !handshake}
        className="inline-flex h-11 items-center bg-foreground px-5 text-sm font-medium text-white hover:bg-black disabled:opacity-60"
      >
        {pending
          ? "Signing in…"
          : handshake
            ? "Sign in"
            : "Preparing secure handshake…"}
      </button>
      </div>
      {handshake ? (
        <div className="space-y-1 font-mono text-[11px] text-muted">
          <p>
            handshake {handshake.handshakeId.slice(0, 8)}… · device{" "}
            {handshake.deviceId.slice(0, 8)}…
          </p>
          <p className="break-all text-accent">
            channel {handshake.channelPath}
          </p>
          {preflight ? <p>preflight: {preflight}</p> : null}
        </div>
      ) : null}
      {message ? (
        <p className="border border-line bg-surface px-3 py-2 text-sm text-foreground">
          {message}
        </p>
      ) : null}
      {error ? (
        <p className="border border-line px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      ) : null}
    </form>
  );
}
