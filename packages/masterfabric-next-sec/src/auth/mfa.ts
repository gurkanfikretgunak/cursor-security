/**
 * MFA / step-up auth stubs for teaching + future wiring.
 * Prompt is not policy: enforce these checks in Server Actions / gateways.
 */

export type MfaMethod = "totp" | "webauthn" | "email_otp";

export type MfaChallenge = {
  userId: string;
  method: MfaMethod;
  issuedAt: string;
  expiresAt: string;
  /** Opaque challenge id — store server-side; never trust client alone. */
  challengeId: string;
};

export type MfaPolicy = {
  requiredFor: Array<"login" | "sensitive" | "admin">;
  methods: MfaMethod[];
};

export const DEFAULT_MFA_POLICY: MfaPolicy = {
  requiredFor: ["sensitive", "admin"],
  methods: ["totp", "webauthn"],
};

/** Placeholder: issue a challenge record (persist in your DB / session). */
export function createMfaChallenge(
  userId: string,
  method: MfaMethod = "totp",
  ttlMs = 5 * 60_000,
): MfaChallenge {
  const issuedAt = new Date();
  return {
    userId,
    method,
    issuedAt: issuedAt.toISOString(),
    expiresAt: new Date(issuedAt.getTime() + ttlMs).toISOString(),
    challengeId: `mfa_${userId.slice(0, 8)}_${issuedAt.getTime()}`,
  };
}

/** Placeholder verifier — replace with real TOTP/WebAuthn validation. */
export function verifyMfaChallengeStub(input: {
  challenge: MfaChallenge;
  code: string;
  now?: Date;
}): { ok: boolean; reason?: string } {
  const now = input.now ?? new Date();
  if (now.toISOString() > input.challenge.expiresAt) {
    return { ok: false, reason: "expired" };
  }
  if (!/^\d{6}$/.test(input.code) && input.challenge.method === "totp") {
    return { ok: false, reason: "invalid_format" };
  }
  // Teaching stub: never treat this as production MFA.
  return { ok: false, reason: "not_implemented" };
}
