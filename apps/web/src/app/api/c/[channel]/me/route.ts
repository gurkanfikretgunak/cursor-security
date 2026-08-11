import { NextResponse } from "next/server";
import {
  AUTH_BARRIER_COOKIE,
  AUTH_BLENDED_COOKIE,
  AUTH_DEVICE_COOKIE,
  verifyChannelAccess,
} from "masterfabric-next-sec/auth";
import { AppError, toPublicError } from "masterfabric-next-sec/errors";
import { cookies } from "next/headers";
import { auth } from "@/auth";
import { audit } from "@/lib/audit";

/**
 * Post-auth private channel — requires device JWT + blended JWT (+ barrier match)
 * and path channel equal to the blended token channel.
 */
export async function GET(
  _request: Request,
  context: { params: Promise<{ channel: string }> },
) {
  const { channel } = await context.params;
  try {
    const secret = process.env.AUTH_SECRET;
    if (!secret) throw new AppError("INTERNAL", "AUTH_SECRET missing.");

    const session = await auth();
    if (!session?.user?.id) {
      throw new AppError("UNAUTHORIZED", "Sign in required.");
    }

    const jar = await cookies();
    const access = verifyChannelAccess({
      secret,
      pathChannelId: channel,
      deviceToken: jar.get(AUTH_DEVICE_COOKIE)?.value,
      blendedToken: jar.get(AUTH_BLENDED_COOKIE)?.value,
      barrierValue: jar.get(AUTH_BARRIER_COOKIE)?.value,
    });

    if (access.blended.sub !== session.user.id) {
      throw new AppError("FORBIDDEN", "Blended token user mismatch.");
    }

    await audit.write({
      event: "auth.channel_access",
      actorUserId: session.user.id,
      metadata: {
        phase: "post-auth",
        route: "me",
        channelId: channel,
        deviceId: access.device.did,
        handshakeId: access.blended.hid,
      },
    });

    return NextResponse.json({
      ok: true,
      phase: "post-auth",
      channelId: channel,
      deviceId: access.device.did,
      userId: access.blended.sub,
      handshakeId: access.blended.hid,
      email: session.user.email,
      message: "Private device channel authorized",
    });
  } catch (error) {
    try {
      await audit.write({
        event: "auth.channel_denied",
        metadata: {
          phase: "post-auth",
          route: "me",
          channelId: channel,
          reason: error instanceof Error ? error.message : "unknown",
        },
      });
    } catch {
      // ignore audit failure
    }
    const pub = toPublicError(error);
    return NextResponse.json(
      { error: { code: pub.code, message: pub.message } },
      { status: pub.status },
    );
  }
}
