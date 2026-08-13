type BackendStatusResponse = {
  ok?: boolean;
  service?: string;
  database?: string;
};

export async function BackendStatus() {
  const base = process.env.BACKEND_URL || process.env.NEXT_PUBLIC_BACKEND_URL;
  if (!base) {
    return (
      <p className="mt-6 font-mono text-xs text-muted">
        Backend: not configured
      </p>
    );
  }

  try {
    const response = await fetch(`${base.replace(/\/$/, "")}/api/v1/status`, {
      next: { revalidate: 30 },
    });
    const body = (await response.json()) as BackendStatusResponse;
    const database = body.database ?? "unknown";
    const label = response.ok && body.ok ? "up" : "degraded";
    return (
      <p className="mt-6 font-mono text-xs text-muted">
        Backend {label}
        <span className="text-line"> · </span>
        db {database}
      </p>
    );
  } catch {
    return (
      <p className="mt-6 font-mono text-xs text-muted">Backend unreachable</p>
    );
  }
}
