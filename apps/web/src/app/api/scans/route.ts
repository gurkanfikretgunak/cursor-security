import { NextResponse } from "next/server";
import { desc, eq, or } from "drizzle-orm";
import { z } from "zod";
import { requireUser } from "masterfabric-next-sec/auth";
import { AppError, toPublicError } from "masterfabric-next-sec/errors";
import { auth } from "@/auth";
import { db } from "@/db";
import { securityScans } from "@/db/schema";
import { audit } from "@/lib/audit";
import { listUserOrgs } from "@/lib/orgs";
import { hasRemoteDatabase } from "@/lib/db-mode";
import { goRequest } from "@/lib/go-backend";
import { addLabScan, listLabScans } from "@/lib/lab-store";
import { buildLabScanReport, compactFindings } from "@/lib/sample-scan";

const reportSchema = z.object({
  projectPath: z.string().optional(),
  scannedAt: z.string().optional(),
  overallScore: z.number().min(0).max(100),
  grade: z.enum(["A", "B", "C", "D", "F"]),
  summary: z.string().optional(),
  findings: z.array(z.unknown()).optional(),
  domains: z.array(z.unknown()).optional(),
});

const ingestSchema = z
  .object({
    demo: z.boolean().optional(),
    report: reportSchema.optional(),
    projectLabel: z.string().min(1).max(200).optional(),
    source: z.enum(["mcp", "cli", "ui", "github-action"]).optional(),
    orgId: z.string().uuid().optional(),
  })
  .superRefine((data, ctx) => {
    if (!data.demo && !data.report) {
      ctx.addIssue({
        code: "custom",
        message: "Provide a report or run a lab scan.",
        path: ["report"],
      });
    }
  });

export async function GET(request: Request) {
  try {
    const session = await auth();
    const user = requireUser(session);
    const limitRaw = Number(
      new URL(request.url).searchParams.get("limit") ?? "20",
    );
    const limit = Math.min(50, Math.max(1, Number.isFinite(limitRaw) ? limitRaw : 20));

    const remote = await goRequest<{
      count: number;
      scans: unknown[];
    }>(user, `/api/v1/scans?limit=${limit}`);
    if (remote) {
      return NextResponse.json(remote);
    }

    if (!hasRemoteDatabase()) {
      const scans = (await listLabScans()).slice(0, limit);
      return NextResponse.json({ count: scans.length, scans });
    }

    const orgs = await listUserOrgs(user.id);
    const orgIds = orgs.map((o) => o.id);
    const filter =
      orgIds.length > 0
        ? or(
            eq(securityScans.actorUserId, user.id),
            ...orgIds.map((id) => eq(securityScans.orgId, id)),
          )
        : eq(securityScans.actorUserId, user.id);

    const rows = await db
      .select({
        id: securityScans.id,
        orgId: securityScans.orgId,
        projectLabel: securityScans.projectLabel,
        overallScore: securityScans.overallScore,
        grade: securityScans.grade,
        summary: securityScans.summary,
        findingCount: securityScans.findingCount,
        source: securityScans.source,
        createdAt: securityScans.createdAt,
      })
      .from(securityScans)
      .where(filter)
      .orderBy(desc(securityScans.createdAt))
      .limit(limit);

    return NextResponse.json({
      count: rows.length,
      scans: rows.map((r) => ({
        ...r,
        createdAt: r.createdAt.toISOString(),
      })),
    });
  } catch (error) {
    const pub = toPublicError(error);
    return NextResponse.json(
      { error: { code: pub.code, message: pub.message } },
      { status: pub.status },
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth();
    const user = requireUser(session);
    const body = ingestSchema.parse(await request.json());
    const orgs = await listUserOrgs(user.id);
    const orgId = body.orgId ?? orgs[0]?.id ?? null;

    if (body.orgId && !orgs.some((o) => o.id === body.orgId)) {
      throw new AppError("FORBIDDEN", "Not a member of that organization.");
    }

    const report = body.demo
      ? buildLabScanReport(body.projectLabel || "cursor-security")
      : body.report!;
    const findings = report.findings ?? [];
    const projectLabel =
      body.projectLabel ||
      report.projectPath?.split("/").filter(Boolean).slice(-1)[0] ||
      "workspace";
    const source = body.demo ? "ui" : (body.source ?? "mcp");
    const overallScore = Math.round(report.overallScore);
    const summary = report.summary ?? "";
    const compact = compactFindings(findings);

    const remoteScan = await goRequest<{
      id: string;
      grade: string;
      overallScore: number;
      createdAt: string;
    }>(user, "/api/v1/scans", {
      method: "POST",
      body: JSON.stringify({
        orgId: orgId ?? undefined,
        projectLabel,
        overallScore,
        grade: report.grade,
        summary,
        findingCount: findings.length,
        source,
        report: report as Record<string, unknown>,
      }),
    });
    if (remoteScan) {
      await audit.write({
        event: "security.scan.ingested",
        actorUserId: user.id,
        orgId,
        resourceType: "security_scan",
        resourceId: remoteScan.id,
        metadata: {
          grade: remoteScan.grade,
          overallScore: remoteScan.overallScore,
          findingCount: findings.length,
          source,
          store: "go-api",
        },
      });
      return NextResponse.json(remoteScan, { status: 201 });
    }

    if (!hasRemoteDatabase()) {
      const row = await addLabScan({
        projectLabel,
        overallScore,
        grade: report.grade,
        summary,
        findingCount: findings.length,
        source,
        findings: compact,
      });
      await audit.write({
        event: "security.scan.ingested",
        actorUserId: user.id,
        orgId,
        resourceType: "security_scan",
        resourceId: row.id,
        metadata: {
          grade: row.grade,
          overallScore: row.overallScore,
          findingCount: findings.length,
          source,
        },
      });
      return NextResponse.json(
        {
          id: row.id,
          grade: row.grade,
          overallScore: row.overallScore,
          createdAt: row.createdAt,
        },
        { status: 201 },
      );
    }

    const [row] = await db
      .insert(securityScans)
      .values({
        orgId,
        actorUserId: user.id,
        projectLabel,
        overallScore,
        grade: report.grade,
        summary,
        findingCount: findings.length,
        source,
        report: report as Record<string, unknown>,
      })
      .returning({
        id: securityScans.id,
        grade: securityScans.grade,
        overallScore: securityScans.overallScore,
        createdAt: securityScans.createdAt,
      });

    await audit.write({
      event: "security.scan.ingested",
      actorUserId: user.id,
      orgId,
      resourceType: "security_scan",
      resourceId: row.id,
      metadata: {
        grade: row.grade,
        overallScore: row.overallScore,
        findingCount: findings.length,
        source,
      },
    });

    return NextResponse.json(
      {
        id: row.id,
        grade: row.grade,
        overallScore: row.overallScore,
        createdAt: row.createdAt.toISOString(),
      },
      { status: 201 },
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: { code: "VALIDATION", message: error.issues[0]?.message } },
        { status: 400 },
      );
    }
    const pub = toPublicError(error);
    return NextResponse.json(
      { error: { code: pub.code, message: pub.message } },
      { status: pub.status },
    );
  }
}
