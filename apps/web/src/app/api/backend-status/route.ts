import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const BACKEND_URL = (
  process.env.BACKEND_URL ||
  process.env.NEXT_PUBLIC_BACKEND_URL ||
  "https://cursor-security-api.onrender.com"
).replace(/\/$/, "");

export async function GET() {
  try {
    const response = await fetch(`${BACKEND_URL}/api/v1/status`, {
      cache: "no-store",
      signal: AbortSignal.timeout(45_000),
    });
    const body = (await response.json()) as Record<string, unknown>;
    return NextResponse.json(
      {
        ok: Boolean(body.ok ?? response.ok),
        service: body.service ?? "cursor-security-api",
        database: body.database ?? "unknown",
        backend: BACKEND_URL,
      },
      { status: 200 },
    );
  } catch {
    return NextResponse.json(
      {
        ok: false,
        service: "cursor-security-api",
        database: "unreachable",
        backend: BACKEND_URL,
      },
      { status: 200 },
    );
  }
}
