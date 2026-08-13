export function formatRelativeTime(iso: string, now = Date.now()): string {
  const then = new Date(iso).getTime();
  if (!Number.isFinite(then)) return iso;
  const delta = Math.max(0, now - then);
  const seconds = Math.round(delta / 1000);
  if (seconds < 8) return "just now";
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatActor(id: string | null | undefined): string | null {
  if (!id) return null;
  return id.startsWith("test:") ? id.slice(5) : id;
}

export function auditFamily(
  event: string,
): "auth" | "org" | "scan" | "other" {
  if (event.startsWith("auth.")) return "auth";
  if (event.startsWith("org.") || event.startsWith("rbac.")) return "org";
  if (event.startsWith("security.")) return "scan";
  return "other";
}
