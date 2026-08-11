import { NextResponse } from "next/server";
import {
  AUTH_BARRIER_COOKIE,
  AUTH_BLENDED_COOKIE,
  AUTH_DEVICE_COOKIE,
  verifyChannelAccess,
} from "masterfabric-next-sec/auth";
import { toPublicError } from "masterfabric-next-sec/errors";
import { cookies } from "next/headers";
import { audit } from "@/lib/audit";

/** Lightweight authenticated channel ping (post-bind). */
export async function GET(
  _request: Request,
  context: { params: Promise<{ channel: string }> },
) {
  const { channel } = await context.params;
  try {
    const secret = process.env.AUTH_SECRET!;
    const jar = await cookies();
    const access = verifyChannelAccess({
      secret,
      pathChannelId: channel,
      deviceToken: jar.get(AUTH_DEVICE_COOKIE)?.value,
      blendedToken: jar.get(AUTH_BLENDED_COOKIE)?.value,
      barrierValue: jar.get(AUTH_BARRIER_COOKIE)?.value,
    });

    await audit.write({
      event: "auth.channel_access",
      actorUserId: access.blended.sub,
      metadata: {
        phase: "post-auth",
        route: "ping",
        channelId: channel,
        deviceId: access.device.did,
      },
    });

    return NextResponse.json({
      ok: true,
      pong: true,
      channelId: channel,
      deviceId: access.device.did,
      userId: access.blended.sub,
    });
  } catch (error) {
    await audit.write({
      event: "auth.channel_denied",
      metadata: { phase: "post-auth", route: "ping", channelId: channel },
    });
    const pub = toPublicError(error);
    return NextResponse.json(
      { error: { code: pub.code, message: pub.message } },
      { status: pub.status },
    );
  }
}
