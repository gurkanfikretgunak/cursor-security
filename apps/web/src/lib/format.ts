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

export function shortId(value: string | null | undefined, size = 8): string | null {
  if (!value) return null;
  return value.length <= size + 1 ? value : `${value.slice(0, size)}…`;
}

export function auditDetailParts(item: {
  actorUserId?: string | null;
  orgId?: string | null;
  resourceType?: string | null;
  resourceId?: string | null;
  ip?: string | null;
  metadata?: Record<string, unknown> | null;
}): string[] {
  const parts: string[] = [];
  const actor = formatActor(item.actorUserId);
  if (actor) parts.push(actor);

  const meta = item.metadata ?? {};
  const reason = typeof meta.reason === "string" ? meta.reason : null;
  const phase = typeof meta.phase === "string" ? meta.phase : null;
  const route = typeof meta.route === "string" ? meta.route : null;
  if (phase && route) parts.push(`${phase}/${route}`);
  else if (phase) parts.push(phase);
  if (reason) parts.push(reason);

  const resourceId = item.resourceId || (typeof meta.channelId === "string" ? meta.channelId : null);
  if (item.resourceType && resourceId) {
    parts.push(`${item.resourceType} ${shortId(resourceId, 10)}`);
  } else if (item.resourceType) {
    parts.push(item.resourceType);
  }

  if (item.ip) parts.push(item.ip);
  if (item.orgId) parts.push(`org ${shortId(item.orgId)}`);
  return parts;
}

export function auditFamily(
  event: string,
): "auth" | "org" | "scan" | "other" {
  if (event.startsWith("auth.")) return "auth";
  if (event.startsWith("org.") || event.startsWith("rbac.")) return "org";
  if (event.startsWith("security.")) return "scan";
  return "other";
}
