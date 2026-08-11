import { NextResponse } from "next/server";
import {
  AUTH_DEVICE_COOKIE,
  deriveChannelId,
  readDeviceJwt,
} from "masterfabric-next-sec/auth";
import { AppError, toPublicError } from "masterfabric-next-sec/errors";
import { cookies } from "next/headers";
import { audit } from "@/lib/audit";

/**
 * Pre-auth channel probe — only the device that owns this handshake channel may call it.
 * Query: ?hid=<handshakeId>
 */
export async function GET(
  request: Request,
  context: { params: Promise<{ channel: string }> },
) {
  try {
    const { channel } = await context.params;
    const hid = new URL(request.url).searchParams.get("hid");
    if (!hid) {
      throw new AppError("VALIDATION", "handshakeId (hid) is required.");
    }

    const secret = process.env.AUTH_SECRET;
    if (!secret) throw new AppError("INTERNAL", "AUTH_SECRET missing.");

    const jar = await cookies();
    const device = readDeviceJwt(jar.get(AUTH_DEVICE_COOKIE)?.value, secret);
    const expected = deriveChannelId(secret, {
      deviceId: device.did,
      handshakeId: hid,
    });

    if (expected !== channel) {
      await audit.write({
        event: "auth.channel_denied",
        metadata: {
          phase: "pre-auth",
          pathChannel: channel,
          expected,
          deviceId: device.did,
        },
      });
      throw new AppError("FORBIDDEN", "This channel is not bound to your device.");
    }

    await audit.write({
      event: "auth.channel_access",
      metadata: {
        phase: "pre-auth",
        route: "preflight",
        channelId: channel,
        deviceId: device.did,
        handshakeId: hid,
      },
    });

    return NextResponse.json({
      ok: true,
      phase: "pre-auth",
      channelId: channel,
      deviceId: device.did,
      message: "Device-bound pre-auth channel OK",
    });
  } catch (error) {
    const pub = toPublicError(error);
    return NextResponse.json(
      { error: { code: pub.code, message: pub.message } },
      { status: pub.status },
    );
  }
}
