"use server";

import { eq } from "drizzle-orm";
import { z } from "zod";
import { requireUser } from "masterfabric-next-sec/auth";
import { actionHandler } from "masterfabric-next-sec/validate";
import { AppError } from "masterfabric-next-sec/errors";
import { auth } from "@/auth";
import { db } from "@/db";
import { memberships, organizations, users } from "@/db/schema";
import { audit } from "@/lib/audit";
import { listUserOrgs, requireOrgRole, slugify } from "@/lib/orgs";
import { limiter } from "@/lib/rate-limit";
import { hasRemoteDatabase } from "@/lib/db-mode";
import { addLabMember, addLabOrganization } from "@/lib/lab-store";

const CreateOrgSchema = z.object({
  name: z.string().trim().min(2).max(80),
});

const InviteSchema = z.object({
  orgId: z.string().uuid(),
  email: z.string().trim().email().max(320),
  role: z.enum(["admin", "member"]).default("member"),
});

export const createOrganization = actionHandler(
  CreateOrgSchema,
  async (input, ctx) => {
    const session = await auth();
    const user = requireUser(session);

    const limited = await limiter.check(
      `create-org:${user.id}:${ctx.ip ?? "unknown"}`,
      "sensitive",
    );
    if (!limited.success) {
      throw new AppError("RATE_LIMITED", "Too many requests. Try again later.");
    }

    if (!hasRemoteDatabase()) {
      const org = await addLabOrganization({
        name: input.name,
        slug: slugify(input.name) || "org",
        userId: user.id,
        email: user.email ?? null,
        displayName: user.name ?? null,
      });
      await audit.write({
        event: "org.created",
        actorUserId: user.id,
        orgId: org.id,
        resourceType: "organization",
        resourceId: org.id,
        ip: ctx.ip,
        userAgent: ctx.userAgent,
        metadata: { name: org.name, slug: org.slug, store: "lab-cookie" },
      });
      return org;
    }

    const baseSlug = slugify(input.name) || "org";
    let slug = baseSlug;
    for (let i = 0; i < 5; i++) {
      const [existing] = await db
        .select({ id: organizations.id })
        .from(organizations)
        .where(eq(organizations.slug, slug))
        .limit(1);
      if (!existing) break;
      slug = `${baseSlug}-${Math.random().toString(36).slice(2, 6)}`;
    }

    const [org] = await db
      .insert(organizations)
      .values({
        name: input.name,
        slug,
        createdByUserId: user.id,
      })
      .returning();

    await db.insert(memberships).values({
      orgId: org.id,
      userId: user.id,
      role: "owner",
    });

    await audit.write({
      event: "org.created",
      actorUserId: user.id,
      orgId: org.id,
      resourceType: "organization",
      resourceId: org.id,
      ip: ctx.ip,
      userAgent: ctx.userAgent,
      metadata: { name: org.name, slug: org.slug },
    });

    return org;
  },
);

export const inviteMember = actionHandler(InviteSchema, async (input, ctx) => {
  const session = await auth();
  const user = requireUser(session);

  await requireOrgRole(input.orgId, user.id, "admin");

  if (!hasRemoteDatabase()) {
    const limitedLab = await limiter.check(
      `invite:${input.orgId}:${user.id}`,
      "sensitive",
    );
    if (!limitedLab.success) {
      throw new AppError("RATE_LIMITED", "Too many invites. Try again later.");
    }
    const member = await addLabMember({
      orgId: input.orgId,
      email: input.email.toLowerCase(),
      role: input.role,
    });
    await audit.write({
      event: "org.member_added",
      actorUserId: user.id,
      orgId: input.orgId,
      resourceType: "user",
      resourceId: member.userId,
      ip: ctx.ip,
      userAgent: ctx.userAgent,
      metadata: { email: member.email, role: member.role, store: "lab-cookie" },
    });
    return { userId: member.userId, email: member.email, role: member.role };
  }

  const limited = await limiter.check(
    `invite:${input.orgId}:${user.id}`,
    "sensitive",
  );
  if (!limited.success) {
    throw new AppError("RATE_LIMITED", "Too many invites. Try again later.");
  }

  let [invitee] = await db
    .select()
    .from(users)
    .where(eq(users.email, input.email.toLowerCase()))
    .limit(1);

  if (!invitee) {
    [invitee] = await db
      .insert(users)
      .values({
        email: input.email.toLowerCase(),
        name: input.email.split("@")[0],
      })
      .returning();
  }

  await db
    .insert(memberships)
    .values({
      orgId: input.orgId,
      userId: invitee.id,
      role: input.role,
    })
    .onConflictDoNothing();

  await audit.write({
    event: "org.member_added",
    actorUserId: user.id,
    orgId: input.orgId,
    resourceType: "user",
    resourceId: invitee.id,
    ip: ctx.ip,
    userAgent: ctx.userAgent,
    metadata: { email: invitee.email, role: input.role },
  });

  return { userId: invitee.id, email: invitee.email, role: input.role };
});

export async function getMyOrganizations() {
  const session = await auth();
  const user = requireUser(session);
  return listUserOrgs(user.id);
}
