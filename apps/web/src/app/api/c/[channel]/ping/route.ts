import { NextResponse } from "next/server";
import {
  AUTH_BARRIER_COOKIE,
  AUTH_BLENDED_COOKIE,
  AUTH_DEVICE_COOKIE,
  verifyChannelAccess,
} from "masterfabric-next-sec/auth";
import { toPublicError } from "masterfabric-next-sec/errors";
import { cookies } from "next/headers";
import {
  writeChannelAccess,
  writeChannelDenied,
} from "@/lib/channel-audit";

/** Lightweight authenticated channel ping (post-bind). */
export async function GET(
  request: Request,
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

    await writeChannelAccess({
      request,
      channel,
      route: "ping",
      phase: "post-auth",
      actorUserId: access.blended.sub,
      deviceId: access.device.did,
      handshakeId: access.blended.hid,
    });

    return NextResponse.json({
      ok: true,
      pong: true,
      channelId: channel,
      deviceId: access.device.did,
      userId: access.blended.sub,
    });
  } catch (error) {
    try {
      await writeChannelDenied({
        request,
        channel,
        route: "ping",
        phase: "post-auth",
        error,
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
