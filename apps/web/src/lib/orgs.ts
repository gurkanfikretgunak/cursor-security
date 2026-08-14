import { and, eq } from "drizzle-orm";
import {
  assertOrgMember,
  roleAtLeast,
  type OrgRole,
} from "masterfabric-next-sec/auth";
import { AppError } from "masterfabric-next-sec/errors";
import { db } from "@/db";
import { memberships, organizations } from "@/db/schema";
import { hasRemoteDatabase } from "@/lib/db-mode";
import { goRequest, type BackendUser } from "@/lib/go-backend";
import { getLabMembership, listLabOrgs } from "@/lib/lab-store";

export type Actor = BackendUser | string;

function asUser(user: Actor): BackendUser {
  return typeof user === "string" ? { id: user } : user;
}

export async function getMembership(orgId: string, user: Actor) {
  const actor = asUser(user);
  const remote = await goRequest<{
    orgs: Array<{ id: string; role: OrgRole }>;
  }>(actor, "/api/v1/orgs");
  if (remote) {
    const org = remote.orgs.find((item) => item.id === orgId);
    if (!org) return null;
    return { orgId, userId: actor.id, role: org.role };
  }

  if (!hasRemoteDatabase()) {
    const lab = await getLabMembership(orgId, actor.id);
    if (!lab) return null;
    return {
      orgId: lab.orgId,
      userId: lab.userId,
      role: lab.role,
    };
  }
  const [row] = await db
    .select()
    .from(memberships)
    .where(and(eq(memberships.orgId, orgId), eq(memberships.userId, actor.id)))
    .limit(1);
  return row ?? null;
}

export async function requireOrgRole(
  orgId: string,
  user: Actor,
  required: OrgRole = "member",
) {
  const actor = asUser(user);
  const membership = await getMembership(orgId, actor);
  return assertOrgMember(
    membership
      ? { userId: membership.userId, role: membership.role }
      : null,
    actor.id,
    required,
  );
}

export async function listUserOrgs(user: Actor) {
  const actor = asUser(user);
  const remote = await goRequest<{
    orgs: Array<{
      id: string;
      name: string;
      slug: string;
      role: OrgRole;
      createdAt: string;
    }>;
  }>(actor, "/api/v1/orgs");
  if (remote) {
    return remote.orgs.map((org) => ({
      id: org.id,
      name: org.name,
      slug: org.slug,
      role: org.role,
      createdAt: new Date(org.createdAt),
    }));
  }

  if (!hasRemoteDatabase()) {
    return (await listLabOrgs()).map((org) => ({
      id: org.id,
      name: org.name,
      slug: org.slug,
      role: org.role,
      createdAt: new Date(org.createdAt),
    }));
  }
  return db
    .select({
      id: organizations.id,
      name: organizations.name,
      slug: organizations.slug,
      role: memberships.role,
      createdAt: organizations.createdAt,
    })
    .from(memberships)
    .innerJoin(organizations, eq(organizations.id, memberships.orgId))
    .where(eq(memberships.userId, actor.id));
}

export async function listOrgMembers(orgId: string, user: Actor) {
  const actor = asUser(user);
  const remote = await goRequest<{
    members: Array<{
      userId: string;
      email: string | null;
      name: string | null;
      role: OrgRole;
    }>;
  }>(actor, `/api/v1/orgs/${orgId}/members`);
  if (remote) return remote.members;
  return null;
}

export function canAdminister(role: OrgRole | null | undefined): boolean {
  return Boolean(role && roleAtLeast(role, "admin"));
}

export async function requireScanAdmin(user: Actor): Promise<void> {
  const orgs = await listUserOrgs(user);
  if (!orgs.some((org) => canAdminister(org.role))) {
    throw new AppError(
      "FORBIDDEN",
      "Only organization admins can remove scans.",
    );
  }
}

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 48);
}
