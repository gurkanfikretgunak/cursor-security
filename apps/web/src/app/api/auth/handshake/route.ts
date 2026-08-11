import { NextResponse } from "next/server";
import { AppError, toPublicError } from "masterfabric-next-sec/errors";
import { issueAuthHandshake } from "@/lib/handshake";
import { audit } from "@/lib/audit";
import { limiter } from "@/lib/rate-limit";

export async function POST(request: Request) {
  try {
    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      "unknown";
    const limited = await limiter.check(`handshake:${ip}`, "auth");
    if (!limited.success) {
      throw new AppError("RATE_LIMITED", "Too many handshake requests.");
    }

    const handshake = await issueAuthHandshake();
    const ua = request.headers.get("user-agent");

    await audit.write({
      event: "auth.handshake",
      ip,
      userAgent: ua,
      metadata: {
        handshakeId: handshake.handshakeId,
        expiresAt: handshake.expiresAt,
        channelId: handshake.channelId,
        channelPath: handshake.channelPath,
        deviceId: handshake.deviceId,
      },
    });

    if (handshake.deviceTokenIssued) {
      await audit.write({
        event: "auth.device",
        ip,
        userAgent: ua,
        metadata: {
          deviceId: handshake.deviceId,
          note: "Anonymous device JWT issued (HttpOnly)",
        },
      });
    }

    await audit.write({
      event: "auth.channel",
      ip,
      userAgent: ua,
      metadata: {
        phase: "pre-auth",
        channelId: handshake.channelId,
        channelPath: handshake.channelPath,
        deviceId: handshake.deviceId,
        handshakeId: handshake.handshakeId,
      },
    });

    return NextResponse.json({
      handshakeId: handshake.handshakeId,
      expiresAt: handshake.expiresAt,
      deviceId: handshake.deviceId,
      channelId: handshake.channelId,
      channelPath: handshake.channelPath,
    });
  } catch (error) {
    const pub = toPublicError(error);
    return NextResponse.json(
      { error: { code: pub.code, message: pub.message } },
      { status: pub.status },
    );
  }
}

export async function GET(request: Request) {
  return POST(request);
}
