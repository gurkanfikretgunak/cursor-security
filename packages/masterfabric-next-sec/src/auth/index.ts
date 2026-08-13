export {
  assertOrgMember,
  assertResourceOwner,
  requireRole,
  requireUser,
  roleAtLeast,
} from "./require.js";
export { createAuthConfig } from "./config.js";
export {
  AUTH_BARRIER_COOKIE,
  consumedBarrierCookieOptions,
  createAuthHandshake,
  requireAuthHandshake,
  verifyAuthHandshake,
  type AuthHandshakeCookieOptions,
  type AuthHandshakePublic,
  type CreateAuthHandshakeResult,
  type VerifyAuthHandshakeResult,
} from "./handshake.js";
export {
  AUTH_BLENDED_COOKIE,
  AUTH_DEVICE_COOKIE,
  buildChannelApiPath,
  deriveChannelId,
  issueBlendedJwt,
  issueDeviceJwt,
  issuePreAuthChannel,
  readBlendedJwt,
  readDeviceJwt,
  verifyChannelAccess,
  type BlendedJwtClaims,
  type DeviceJwtClaims,
} from "./channel.js";
export {
  fingerprintSecret,
  signHs256Jwt,
  verifyHs256Jwt,
} from "./jwt.js";
export {
  DEFAULT_SESSION_TIMEOUTS,
  ORG_ROLE_RANK,
  type AuthSession,
  type AuthUser,
  type OrgRole,
  type SessionTimeoutOptions,
} from "./types.js";
export {
  DEFAULT_MFA_POLICY,
  createMfaChallenge,
  verifyMfaChallengeStub,
  type MfaChallenge,
  type MfaMethod,
  type MfaPolicy,
} from "./mfa.js";
