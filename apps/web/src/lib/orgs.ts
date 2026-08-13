import { and, eq } from "drizzle-orm";
import {
  assertOrgMember,
  type OrgRole,
} from "masterfabric-next-sec/auth";
import { db } from "@/db";
import { memberships, organizations } from "@/db/schema";
import { hasRemoteDatabase } from "@/lib/db-mode";
import { getLabMembership, listLabOrgs } from "@/lib/lab-store";

export async function getMembership(orgId: string, userId: string) {
  if (!hasRemoteDatabase()) {
    const lab = await getLabMembership(orgId, userId);
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
    .where(and(eq(memberships.orgId, orgId), eq(memberships.userId, userId)))
    .limit(1);
  return row ?? null;
}

export async function requireOrgRole(
  orgId: string,
  userId: string,
  required: OrgRole = "member",
) {
  const membership = await getMembership(orgId, userId);
  return assertOrgMember(
    membership
      ? { userId: membership.userId, role: membership.role }
      : null,
    userId,
    required,
  );
}

export async function listUserOrgs(userId: string) {
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
    .where(eq(memberships.userId, userId));
}

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 48);
}
