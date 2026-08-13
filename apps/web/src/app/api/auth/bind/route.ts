import { NextResponse } from "next/server";
import { z } from "zod";
import { AppError, toPublicError } from "masterfabric-next-sec/errors";
import { requireUser } from "masterfabric-next-sec/auth";
import { auth } from "@/auth";
import { audit } from "@/lib/audit";
import { bindBlendedSession } from "@/lib/handshake";
import { limiter } from "@/lib/rate-limit";

const BodySchema = z.object({
  handshakeId: z.string().uuid(),
});

/**
 * Post-login bind: anonymous device JWT + session user + barrier → blended JWT
 * and a user-unique channel API path.
 */
export async function POST(request: Request) {
  try {
    const session = await auth();
    const user = requireUser(session);
    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      "unknown";
    const limited = await limiter.check(`bind:${user.id}:${ip}`, "sensitive");
    if (!limited.success) {
      throw new AppError("RATE_LIMITED", "Too many bind requests.");
    }

    const raw = await request.json();
    const body = BodySchema.parse(raw);
    const bound = await bindBlendedSession({
      userId: user.id,
      handshakeId: body.handshakeId,
    });

    const ua = request.headers.get("user-agent");

    await audit.write({
      event: "auth.blended",
      actorUserId: user.id,
      ip,
      userAgent: ua,
      resourceType: "channel",
      resourceId: bound.channelId,
      metadata: {
        deviceId: bound.deviceId,
        channelId: bound.channelId,
        channelPath: bound.channelPath,
        handshakeId: bound.handshakeId,
        barrierFingerprint: bound.barrierFingerprint.slice(0, 12) + "…",
      },
    });

    await audit.write({
      event: "auth.channel",
      actorUserId: user.id,
      ip,
      userAgent: ua,
      resourceType: "channel",
      resourceId: bound.channelId,
      metadata: {
        phase: "post-auth",
        channelId: bound.channelId,
        channelPath: bound.channelPath,
        deviceId: bound.deviceId,
      },
    });

    return NextResponse.json({
      deviceId: bound.deviceId,
      channelId: bound.channelId,
      channelPath: bound.channelPath,
      handshakeId: bound.handshakeId,
    });
  } catch (error) {
    const pub = toPublicError(error);
    return NextResponse.json(
      { error: { code: pub.code, message: pub.message } },
      { status: pub.status },
    );
  }
}
