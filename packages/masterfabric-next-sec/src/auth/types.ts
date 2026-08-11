export type OrgRole = "owner" | "admin" | "member";

export const ORG_ROLE_RANK: Record<OrgRole, number> = {
  member: 1,
  admin: 2,
  owner: 3,
};

export type AuthUser = {
  id: string;
  email?: string | null;
  name?: string | null;
  image?: string | null;
};

export type AuthSession = {
  user: AuthUser;
  expires: string;
};

export type SessionTimeoutOptions = {
  /** Absolute session lifetime in seconds (default 8h). */
  maxAgeSeconds?: number;
  /** Update session cookie age on activity (Auth.js session.updateAge). */
  updateAgeSeconds?: number;
};

export const DEFAULT_SESSION_TIMEOUTS: Required<SessionTimeoutOptions> = {
  maxAgeSeconds: 60 * 60 * 8,
  updateAgeSeconds: 60 * 60,
};
