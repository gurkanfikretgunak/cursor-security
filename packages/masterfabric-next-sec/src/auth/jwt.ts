import { createHmac, timingSafeEqual } from "node:crypto";
import { AppError } from "../errors/index.js";

export type JwtHeader = { alg: "HS256"; typ: "JWT" };

function b64urlJson(value: unknown): string {
  return Buffer.from(JSON.stringify(value), "utf8").toString("base64url");
}

function b64urlToBuffer(value: string): Buffer {
  return Buffer.from(value, "base64url");
}

function signInput(secret: string, data: string): string {
  return createHmac("sha256", secret).update(data).digest("base64url");
}

function safeEqual(a: string, b: string): boolean {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  if (left.length !== right.length) return false;
  return timingSafeEqual(left, right);
}

/** Compact HS256 JWT (no external jose dependency). */
export function signHs256Jwt(
  payload: Record<string, unknown>,
  secret: string,
  expiresInSeconds: number,
): string {
  if (!secret || secret.length < 16) {
    throw new AppError("INTERNAL", "JWT secret is not configured.");
  }
  const now = Math.floor(Date.now() / 1000);
  const header: JwtHeader = { alg: "HS256", typ: "JWT" };
  const body = {
    ...payload,
    iat: now,
    exp: now + expiresInSeconds,
  };
  const h = b64urlJson(header);
  const p = b64urlJson(body);
  const sig = signInput(secret, `${h}.${p}`);
  return `${h}.${p}.${sig}`;
}

export function verifyHs256Jwt<T extends Record<string, unknown>>(
  token: string | null | undefined,
  secret: string,
): T {
  if (!token) {
    throw new AppError("UNAUTHORIZED", "Missing token.");
  }
  const parts = token.split(".");
  if (parts.length !== 3) {
    throw new AppError("UNAUTHORIZED", "Malformed token.");
  }
  const [h, p, sig] = parts;
  const expected = signInput(secret, `${h}.${p}`);
  if (!safeEqual(sig, expected)) {
    throw new AppError("UNAUTHORIZED", "Invalid token signature.");
  }
  let payload: T & { exp?: number };
  try {
    payload = JSON.parse(b64urlToBuffer(p).toString("utf8")) as T & {
      exp?: number;
    };
  } catch {
    throw new AppError("UNAUTHORIZED", "Invalid token payload.");
  }
  if (typeof payload.exp !== "number" || payload.exp * 1000 < Date.now()) {
    throw new AppError("UNAUTHORIZED", "Token expired.");
  }
  return payload;
}

export function fingerprintSecret(value: string): string {
  return createHmac("sha256", "mf-barrier-fp")
    .update(value)
    .digest("base64url");
}
