import { NextResponse } from "next/server";
import {
  AUTH_BLENDED_COOKIE,
  AUTH_DEVICE_COOKIE,
  buildChannelApiPath,
  readBlendedJwt,
  readDeviceJwt,
} from "masterfabric-next-sec/auth";
import { AppError, toPublicError } from "masterfabric-next-sec/errors";
import { cookies } from "next/headers";
import { auth } from "@/auth";

/** Return current private channel if device + blended cookies already exist. */
export async function GET() {
  try {
    const secret = process.env.AUTH_SECRET;
    if (!secret) throw new AppError("INTERNAL", "AUTH_SECRET missing.");
    const session = await auth();
    if (!session?.user?.id) {
      throw new AppError("UNAUTHORIZED", "Sign in required.");
    }

    const jar = await cookies();
    const device = readDeviceJwt(jar.get(AUTH_DEVICE_COOKIE)?.value, secret);
    const blended = readBlendedJwt(jar.get(AUTH_BLENDED_COOKIE)?.value, secret);
    if (blended.sub !== session.user.id || blended.did !== device.did) {
      throw new AppError("FORBIDDEN", "Bound session mismatch.");
    }

    return NextResponse.json({
      ok: true,
      deviceId: device.did,
      channelId: blended.chn,
      channelPath: buildChannelApiPath(blended.chn, "me"),
      handshakeId: blended.hid,
    });
  } catch (error) {
    const pub = toPublicError(error);
    return NextResponse.json(
      { error: { code: pub.code, message: pub.message } },
      { status: pub.status },
    );
  }
}
