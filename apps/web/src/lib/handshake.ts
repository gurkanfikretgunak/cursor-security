import {
  AUTH_BARRIER_COOKIE,
  AUTH_BLENDED_COOKIE,
  AUTH_DEVICE_COOKIE,
  createAuthHandshake,
  issueBlendedJwt,
  issueDeviceJwt,
  issuePreAuthChannel,
  readDeviceJwt,
  requireAuthHandshake,
} from "masterfabric-next-sec/auth";
import { cookies } from "next/headers";

function authSecret(): string {
  const secret = process.env.AUTH_SECRET;
  if (!secret) {
    throw new Error("AUTH_SECRET is required for auth handshake.");
  }
  return secret;
}

export type IssuedHandshakeBundle = {
  handshakeId: string;
  expiresAt: number;
  deviceId: string;
  channelId: string;
  channelPath: string;
  deviceTokenIssued: boolean;
};

/** Issue handshake + device anonymous JWT + pre-auth channel path. */
export async function issueAuthHandshake(): Promise<IssuedHandshakeBundle> {
  const secret = authSecret();
  const jar = await cookies();
  const issued = createAuthHandshake({ secret });
  jar.set(issued.cookieName, issued.cookieValue, issued.cookieOptions);

  let deviceId: string;
  let deviceTokenIssued = false;
  const existing = jar.get(AUTH_DEVICE_COOKIE)?.value;
  try {
    deviceId = readDeviceJwt(existing, secret).did;
  } catch {
    const device = issueDeviceJwt({ secret });
    jar.set(device.cookieName, device.token, device.cookieOptions);
    deviceId = device.claims.did;
    deviceTokenIssued = true;
  }

  const channel = issuePreAuthChannel({
    secret,
    deviceId,
    handshakeId: issued.public.handshakeId,
  });

  return {
    handshakeId: issued.public.handshakeId,
    expiresAt: issued.public.expiresAt,
    deviceId,
    channelId: channel.channelId,
    channelPath: channel.channelPath,
    deviceTokenIssued,
  };
}

/** Verify handshakeId ↔ barrier without clearing (barrier kept for blend). */
export async function assertAuthHandshake(handshakeId: string) {
  const jar = await cookies();
  const cookieValue = jar.get(AUTH_BARRIER_COOKIE)?.value;
  return requireAuthHandshake({
    secret: authSecret(),
    handshakeId,
    cookieValue,
  });
}

/** After login: blend user JWT claims with barrier + device → channel-bound token. */
export async function bindBlendedSession(options: {
  userId: string;
  handshakeId: string;
}) {
  const secret = authSecret();
  const jar = await cookies();
  const barrierValue = jar.get(AUTH_BARRIER_COOKIE)?.value;
  if (!barrierValue) {
    throw new Error("Barrier cookie missing for blend.");
  }

  const device = readDeviceJwt(jar.get(AUTH_DEVICE_COOKIE)?.value, secret);
  requireAuthHandshake({
    secret,
    handshakeId: options.handshakeId,
    cookieValue: barrierValue,
  });

  const blended = issueBlendedJwt({
    secret,
    userId: options.userId,
    deviceId: device.did,
    handshakeId: options.handshakeId,
    barrierValue,
  });

  jar.set(blended.cookieName, blended.token, blended.cookieOptions);

  return {
    deviceId: device.did,
    channelId: blended.channelId,
    channelPath: blended.channelPath,
    barrierFingerprint: blended.barrierFingerprint,
    handshakeId: options.handshakeId,
  };
}

export async function readChannelCookies() {
  const jar = await cookies();
  return {
    deviceToken: jar.get(AUTH_DEVICE_COOKIE)?.value,
    blendedToken: jar.get(AUTH_BLENDED_COOKIE)?.value,
    barrierValue: jar.get(AUTH_BARRIER_COOKIE)?.value,
  };
}
