import { createHmac, randomUUID } from "node:crypto";
import { AppError } from "../errors/index.js";
import { fingerprintSecret, signHs256Jwt, verifyHs256Jwt } from "./jwt.js";

export const AUTH_DEVICE_COOKIE = "mf_device_jwt";
export const AUTH_BLENDED_COOKIE = "mf_blended_jwt";

export type DeviceJwtClaims = {
  typ: "device";
  did: string;
};

export type BlendedJwtClaims = {
  typ: "blended";
  sub: string;
  did: string;
  hid: string;
  bfp: string;
  chn: string;
};

export type ChannelCookieOptions = {
  httpOnly: true;
  secure: boolean;
  sameSite: "lax";
  path: string;
  maxAge: number;
};

function cookieBase(maxAge: number, secure?: boolean): ChannelCookieOptions {
  return {
    httpOnly: true,
    secure: secure ?? process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge,
  };
}

/** Derive a per-device / per-user API channel id (path segment). */
export function deriveChannelId(
  secret: string,
  parts: {
    deviceId: string;
    handshakeId?: string;
    userId?: string;
    barrierFingerprint?: string;
  },
): string {
  const material = [
    parts.deviceId,
    parts.handshakeId ?? "",
    parts.userId ?? "",
    parts.barrierFingerprint ?? "",
  ].join("|");
  return createHmac("sha256", secret)
    .update(material)
    .digest("base64url")
    .replace(/[^a-zA-Z0-9]/g, "")
    .slice(0, 24);
}

export function buildChannelApiPath(channelId: string, route = "ping"): string {
  const clean = route.replace(/^\/+/, "");
  return `/api/c/${channelId}/${clean}`;
}

export function issueDeviceJwt(options: {
  secret: string;
  deviceId?: string;
  ttlSeconds?: number;
  secure?: boolean;
}): {
  token: string;
  claims: DeviceJwtClaims;
  cookieName: typeof AUTH_DEVICE_COOKIE;
  cookieOptions: ChannelCookieOptions;
} {
  const ttlSeconds = options.ttlSeconds ?? 60 * 60 * 24 * 30;
  const did = options.deviceId ?? randomUUID();
  const claims: DeviceJwtClaims = { typ: "device", did };
  const token = signHs256Jwt(claims, options.secret, ttlSeconds);
  return {
    token,
    claims,
    cookieName: AUTH_DEVICE_COOKIE,
    cookieOptions: cookieBase(ttlSeconds, options.secure),
  };
}

export function readDeviceJwt(
  token: string | null | undefined,
  secret: string,
): DeviceJwtClaims {
  const claims = verifyHs256Jwt<DeviceJwtClaims>(token, secret);
  if (claims.typ !== "device" || typeof claims.did !== "string") {
    throw new AppError("UNAUTHORIZED", "Invalid device token.");
  }
  return claims;
}

/**
 * Blend user identity + device + barrier fingerprint into a single JWT.
 * Channel id is bound into the token so path spoofing fails.
 */
export function issueBlendedJwt(options: {
  secret: string;
  userId: string;
  deviceId: string;
  handshakeId: string;
  barrierValue: string;
  ttlSeconds?: number;
  secure?: boolean;
}): {
  token: string;
  claims: BlendedJwtClaims;
  channelId: string;
  channelPath: string;
  cookieName: typeof AUTH_BLENDED_COOKIE;
  cookieOptions: ChannelCookieOptions;
  barrierFingerprint: string;
} {
  const ttlSeconds = options.ttlSeconds ?? 60 * 60 * 8;
  const bfp = fingerprintSecret(options.barrierValue);
  const channelId = deriveChannelId(options.secret, {
    deviceId: options.deviceId,
    userId: options.userId,
    barrierFingerprint: bfp,
    handshakeId: options.handshakeId,
  });
  const claims: BlendedJwtClaims = {
    typ: "blended",
    sub: options.userId,
    did: options.deviceId,
    hid: options.handshakeId,
    bfp,
    chn: channelId,
  };
  const token = signHs256Jwt(claims, options.secret, ttlSeconds);
  return {
    token,
    claims,
    channelId,
    channelPath: buildChannelApiPath(channelId, "me"),
    cookieName: AUTH_BLENDED_COOKIE,
    cookieOptions: cookieBase(ttlSeconds, options.secure),
    barrierFingerprint: bfp,
  };
}

export function readBlendedJwt(
  token: string | null | undefined,
  secret: string,
): BlendedJwtClaims {
  const claims = verifyHs256Jwt<BlendedJwtClaims>(token, secret);
  if (
    claims.typ !== "blended" ||
    typeof claims.sub !== "string" ||
    typeof claims.did !== "string" ||
    typeof claims.chn !== "string" ||
    typeof claims.bfp !== "string"
  ) {
    throw new AppError("UNAUTHORIZED", "Invalid blended token.");
  }
  return claims;
}

/**
 * Verify a device-scoped channel API call.
 * Requires path channel === token channel and device JWT match.
 */
export function verifyChannelAccess(options: {
  secret: string;
  pathChannelId: string;
  deviceToken: string | null | undefined;
  blendedToken: string | null | undefined;
  barrierValue?: string | null;
}): {
  device: DeviceJwtClaims;
  blended: BlendedJwtClaims;
} {
  const device = readDeviceJwt(options.deviceToken, options.secret);
  const blended = readBlendedJwt(options.blendedToken, options.secret);

  if (blended.did !== device.did) {
    throw new AppError("FORBIDDEN", "Device / session token mismatch.");
  }
  if (blended.chn !== options.pathChannelId) {
    throw new AppError("FORBIDDEN", "Channel path is not bound to this session.");
  }
  if (options.barrierValue) {
    const fp = fingerprintSecret(options.barrierValue);
    if (fp !== blended.bfp) {
      throw new AppError("FORBIDDEN", "Barrier key does not match blended token.");
    }
  }
  return { device, blended };
}

export function issuePreAuthChannel(options: {
  secret: string;
  deviceId: string;
  handshakeId: string;
}): { channelId: string; channelPath: string } {
  const channelId = deriveChannelId(options.secret, {
    deviceId: options.deviceId,
    handshakeId: options.handshakeId,
  });
  return {
    channelId,
    channelPath: buildChannelApiPath(channelId, "preflight"),
  };
}
