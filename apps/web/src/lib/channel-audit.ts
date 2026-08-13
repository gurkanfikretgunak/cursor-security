import {
  AUTH_DEVICE_COOKIE,
  readDeviceJwt,
} from "masterfabric-next-sec/auth";
import { AppError } from "masterfabric-next-sec/errors";
import { cookies } from "next/headers";
import { auth } from "@/auth";
import { audit } from "@/lib/audit";

export function clientAudit(request: Request): {
  ip: string;
  userAgent: string | null;
} {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown";
  return { ip, userAgent: request.headers.get("user-agent") };
}

export function auditReason(error: unknown): string {
  if (error instanceof AppError) return error.message;
  if (error instanceof Error) return error.message.slice(0, 160);
  return "unknown";
}

export async function peekChannelActor(): Promise<{
  actorUserId: string | null;
  deviceId: string | null;
}> {
  const session = await auth();
  let deviceId: string | null = null;
  try {
    const secret = process.env.AUTH_SECRET;
    if (secret) {
      const jar = await cookies();
      deviceId = readDeviceJwt(jar.get(AUTH_DEVICE_COOKIE)?.value, secret).did;
    }
  } catch {
    // Missing or invalid device cookie — still record the deny.
  }
  return { actorUserId: session?.user?.id ?? null, deviceId };
}

export async function writeChannelDenied(input: {
  request: Request;
  channel: string;
  route: string;
  phase: "pre-auth" | "post-auth";
  error: unknown;
  extra?: Record<string, unknown>;
}): Promise<void> {
  const { ip, userAgent } = clientAudit(input.request);
  const { actorUserId, deviceId } = await peekChannelActor();
  await audit.write({
    event: "auth.channel_denied",
    actorUserId,
    ip,
    userAgent,
    resourceType: "channel",
    resourceId: input.channel,
    metadata: {
      phase: input.phase,
      route: input.route,
      channelId: input.channel,
      reason: auditReason(input.error),
      ...(deviceId ? { deviceId } : {}),
      ...input.extra,
    },
  });
}

export async function writeChannelAccess(input: {
  request: Request;
  channel: string;
  route: string;
  phase: "pre-auth" | "post-auth";
  actorUserId?: string | null;
  deviceId?: string;
  handshakeId?: string;
}): Promise<void> {
  const { ip, userAgent } = clientAudit(input.request);
  await audit.write({
    event: "auth.channel_access",
    actorUserId: input.actorUserId ?? null,
    ip,
    userAgent,
    resourceType: "channel",
    resourceId: input.channel,
    metadata: {
      phase: input.phase,
      route: input.route,
      channelId: input.channel,
      ...(input.deviceId ? { deviceId: input.deviceId } : {}),
      ...(input.handshakeId ? { handshakeId: input.handshakeId } : {}),
    },
  });
}
