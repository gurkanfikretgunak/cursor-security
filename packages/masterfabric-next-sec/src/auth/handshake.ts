import {
  createHmac,
  randomBytes,
  randomUUID,
  timingSafeEqual,
} from "node:crypto";
import { AppError } from "../errors/index.js";

/** HttpOnly barrier cookie binding the browser to a one-time auth handshake. */
export const AUTH_BARRIER_COOKIE = "mf_auth_barrier";

export type AuthHandshakePublic = {
  handshakeId: string;
  expiresAt: number;
};

export type AuthHandshakeCookieOptions = {
  httpOnly: true;
  secure: boolean;
  sameSite: "lax";
  path: string;
  maxAge: number;
};

export type CreateAuthHandshakeResult = {
  public: AuthHandshakePublic;
  cookieName: typeof AUTH_BARRIER_COOKIE;
  cookieValue: string;
  cookieOptions: AuthHandshakeCookieOptions;
};

function sign(secret: string, payload: string): string {
  return createHmac("sha256", secret).update(payload).digest("base64url");
}

function safeEqual(a: string, b: string): boolean {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  if (left.length !== right.length) return false;
  return timingSafeEqual(left, right);
}

/**
 * Create an auth handshake:
 * - Client receives `handshakeId` (public)
 * - Browser stores HMAC-signed barrier in HttpOnly cookie
 * - Subsequent auth actions must present matching handshakeId + cookie
 */
export function createAuthHandshake(options: {
  secret: string;
  /** Lifetime in seconds (default 10 minutes). */
  ttlSeconds?: number;
  secure?: boolean;
}): CreateAuthHandshakeResult {
  if (!options.secret || options.secret.length < 16) {
    throw new AppError("INTERNAL", "Auth handshake secret is not configured.");
  }

  const ttlSeconds = options.ttlSeconds ?? 600;
  const handshakeId = randomUUID();
  const nonce = randomBytes(24).toString("base64url");
  const expiresAt = Date.now() + ttlSeconds * 1000;
  const payload = `${handshakeId}.${expiresAt}.${nonce}`;
  const cookieValue = `${payload}.${sign(options.secret, payload)}`;

  return {
    public: { handshakeId, expiresAt },
    cookieName: AUTH_BARRIER_COOKIE,
    cookieValue,
    cookieOptions: {
      httpOnly: true,
      secure: options.secure ?? process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: ttlSeconds,
    },
  };
}

export type VerifyAuthHandshakeResult =
  | { ok: true; handshakeId: string; expiresAt: number }
  | { ok: false; reason: "missing" | "malformed" | "bad_signature" | "expired" | "mismatch" };

/**
 * Verify client `handshakeId` against the HttpOnly barrier cookie.
 * Call before issuing magic links / sensitive auth mutations.
 */
export function verifyAuthHandshake(options: {
  secret: string;
  handshakeId: string;
  cookieValue: string | null | undefined;
}): VerifyAuthHandshakeResult {
  const cookieValue = options.cookieValue;
  if (!cookieValue) return { ok: false, reason: "missing" };

  const parts = cookieValue.split(".");
  if (parts.length !== 4) return { ok: false, reason: "malformed" };

  const [handshakeId, expiresRaw, nonce, signature] = parts;
  if (!handshakeId || !expiresRaw || !nonce || !signature) {
    return { ok: false, reason: "malformed" };
  }

  const payload = `${handshakeId}.${expiresRaw}.${nonce}`;
  const expected = sign(options.secret, payload);
  if (!safeEqual(signature, expected)) {
    return { ok: false, reason: "bad_signature" };
  }

  const expiresAt = Number(expiresRaw);
  if (!Number.isFinite(expiresAt) || Date.now() > expiresAt) {
    return { ok: false, reason: "expired" };
  }

  if (handshakeId !== options.handshakeId) {
    return { ok: false, reason: "mismatch" };
  }

  return { ok: true, handshakeId, expiresAt };
}

/** Throw AppError when handshake/barrier verification fails. */
export function requireAuthHandshake(options: {
  secret: string;
  handshakeId: string;
  cookieValue: string | null | undefined;
}): { handshakeId: string; expiresAt: number } {
  const result = verifyAuthHandshake(options);
  if (!result.ok) {
    throw new AppError(
      "FORBIDDEN",
      "Auth handshake required. Refresh the page and try again.",
      { details: { reason: result.reason } },
    );
  }
  return { handshakeId: result.handshakeId, expiresAt: result.expiresAt };
}

/** Cookie clear options after one-time consume. */
export function consumedBarrierCookieOptions(secure?: boolean): AuthHandshakeCookieOptions & {
  value: string;
} {
  return {
    value: "",
    httpOnly: true,
    secure: secure ?? process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  };
}
