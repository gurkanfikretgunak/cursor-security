import { AppError } from "../errors/index.js";
import {
  ORG_ROLE_RANK,
  type AuthSession,
  type AuthUser,
  type OrgRole,
} from "./types.js";

export function requireUser(
  session:
    | AuthSession
    | { user?: { id?: string | null; email?: string | null; name?: string | null; image?: string | null } | null }
    | null
    | undefined,
): AuthUser {
  const id = session?.user?.id;
  if (!id) {
    throw new AppError("UNAUTHORIZED", "Authentication required.");
  }
  return {
    id,
    email: session.user?.email,
    name: session.user?.name,
    image: session.user?.image,
  };
}

export function roleAtLeast(actual: OrgRole, required: OrgRole): boolean {
  return ORG_ROLE_RANK[actual] >= ORG_ROLE_RANK[required];
}

export function requireRole(
  actual: OrgRole | null | undefined,
  required: OrgRole,
): OrgRole {
  if (!actual || !roleAtLeast(actual, required)) {
    throw new AppError("FORBIDDEN", "You do not have permission for this action.");
  }
  return actual;
}

export function assertResourceOwner(
  actorUserId: string,
  resourceOwnerId: string,
  message = "You do not own this resource.",
): void {
  if (actorUserId !== resourceOwnerId) {
    throw new AppError("FORBIDDEN", message);
  }
}

export function assertOrgMember(
  membership: { userId: string; role: OrgRole } | null | undefined,
  userId: string,
  required: OrgRole = "member",
): OrgRole {
  if (!membership || membership.userId !== userId) {
    throw new AppError("FORBIDDEN", "You are not a member of this organization.");
  }
  return requireRole(membership.role, required);
}
