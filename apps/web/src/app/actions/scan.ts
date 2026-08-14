"use server";

import { eq } from "drizzle-orm";
import { z } from "zod";
import { requireUser } from "masterfabric-next-sec/auth";
import { AppError } from "masterfabric-next-sec/errors";
import { actionHandler } from "masterfabric-next-sec/validate";
import { auth } from "@/auth";
import { db } from "@/db";
import { securityScans } from "@/db/schema";
import { audit } from "@/lib/audit";
import { hasRemoteDatabase } from "@/lib/db-mode";
import { goRequest } from "@/lib/go-backend";
import { removeLabScan } from "@/lib/lab-store";
import { requireOrgRole, requireScanAdmin } from "@/lib/orgs";

const RemoveScanSchema = z.object({
  scanId: z.string().uuid(),
});

export const removeScan = actionHandler(RemoveScanSchema, async (input) => {
  const session = await auth();
  const user = requireUser(session);
  await requireScanAdmin(user);

  try {
    const remote = await goRequest<{ removed?: boolean }>(
      user,
      `/api/v1/scans/${input.scanId}`,
      { method: "DELETE" },
    );
    if (remote) {
      await audit.write({
        event: "security.scan.removed",
        actorUserId: user.id,
        resourceType: "security_scan",
        resourceId: input.scanId,
        metadata: { store: "go-api" },
      });
      return { removed: true as const };
    }
  } catch (error) {
    if (!(error instanceof AppError) || error.code !== "NOT_FOUND") {
      throw error;
    }
  }

  if (!hasRemoteDatabase()) {
    const removed = await removeLabScan(input.scanId);
    if (!removed) {
      throw new AppError("NOT_FOUND", "Scan not found.");
    }
    await audit.write({
      event: "security.scan.removed",
      actorUserId: user.id,
      resourceType: "security_scan",
      resourceId: input.scanId,
      metadata: { store: "lab-cookie" },
    });
    return { removed: true as const };
  }

  const [row] = await db
    .select({
      id: securityScans.id,
      orgId: securityScans.orgId,
    })
    .from(securityScans)
    .where(eq(securityScans.id, input.scanId))
    .limit(1);
  if (!row) {
    throw new AppError("NOT_FOUND", "Scan not found.");
  }
  if (row.orgId) {
    await requireOrgRole(row.orgId, user, "admin");
  }

  await db.delete(securityScans).where(eq(securityScans.id, input.scanId));
  await audit.write({
    event: "security.scan.removed",
    actorUserId: user.id,
    orgId: row.orgId,
    resourceType: "security_scan",
    resourceId: input.scanId,
    metadata: { store: "postgres" },
  });
  return { removed: true as const };
});
