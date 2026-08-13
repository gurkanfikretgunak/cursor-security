import { AsyncLocalStorage } from "node:async_hooks";
import { createHmac, randomUUID, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import type { AuditEventInput } from "masterfabric-next-sec/audit";
import type { OrgRole } from "masterfabric-next-sec/auth";
import type { AuditRow } from "@/lib/security-report";

const MAX_EVENTS = 60;
const MAX_SCANS = 6;
const MAX_AGE = 60 * 60 * 24 * 7;
const als = new AsyncLocalStorage<{ state: LabState }>();

type CompactEvent = {
  i: string;
  e: string;
  t: number;
  u?: string;
  o?: string;
  r?: string;
  d?: string;
};

export type LabOrg = {
  id: string;
  name: string;
  slug: string;
  role: OrgRole;
  createdAt: string;
};

export type LabMember = {
  userId: string;
  orgId: string;
  email: string;
  name: string;
  role: OrgRole;
};

export type LabScan = {
  id: string;
  projectLabel: string;
  overallScore: number;
  grade: "A" | "B" | "C" | "D" | "F";
  summary: string;
  findingCount: number;
  source: string;
  createdAt: string;
  findings: Array<{ severity: string; title: string }>;
};

type CompactScan = {
  i: string;
  p: string;
  s: number;
  g: LabScan["grade"];
  m: string;
  n: number;
  c: string;
  t: number;
  f: Array<{ v: string; t: string }>;
};

type ScanJar = { scans: CompactScan[] };

type LabState = {
  ev: CompactEvent[];
  orgs: LabOrg[];
  members: LabMember[];
};

function cookieName(): string {
  return process.env.NODE_ENV === "production"
    ? "__Host-cursor-security-lab"
    : "cursor-security-lab";
}

function scanCookieName(): string {
  return process.env.NODE_ENV === "production"
    ? "__Host-cursor-security-scans"
    : "cursor-security-scans";
}

function cookieOpts(maxAge: number) {
  return {
    httpOnly: true as const,
    sameSite: "lax" as const,
    path: "/",
    secure: process.env.NODE_ENV === "production",
    maxAge,
  };
}

function secret(): string | null {
  return process.env.AUTH_SECRET || null;
}

function empty(): LabState {
  return { ev: [], orgs: [], members: [] };
}

function encode(value: unknown, key: string): string {
  const payload = Buffer.from(JSON.stringify(value), "utf8").toString(
    "base64url",
  );
  const sig = createHmac("sha256", key).update(payload).digest("base64url");
  return `${payload}.${sig}`;
}

function unsign(raw: string | undefined, key: string): unknown {
  if (!raw) return null;
  const dot = raw.lastIndexOf(".");
  if (dot <= 0) return null;
  const payload = raw.slice(0, dot);
  const sig = raw.slice(dot + 1);
  const expected = createHmac("sha256", key).update(payload).digest("base64url");
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  try {
    return JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
  } catch {
    return null;
  }
}

function decode(raw: string | undefined, key: string): LabState {
  const parsed = unsign(raw, key) as LabState | null;
  if (!parsed) return empty();
  return {
    ev: Array.isArray(parsed.ev) ? parsed.ev : [],
    orgs: Array.isArray(parsed.orgs) ? parsed.orgs : [],
    members: Array.isArray(parsed.members) ? parsed.members : [],
  };
}

async function readFromCookie(): Promise<LabState> {
  const key = secret();
  if (!key) return empty();
  const jar = await cookies();
  return decode(jar.get(cookieName())?.value, key);
}

async function persist(state: LabState): Promise<void> {
  const key = secret();
  if (!key) return;
  const jar = await cookies();
  jar.set(cookieName(), encode(state, key), cookieOpts(MAX_AGE));
}

async function withLabState<T>(fn: (state: LabState) => Promise<T> | T): Promise<T> {
  const existing = als.getStore();
  if (existing) {
    const result = await fn(existing.state);
    await persist(existing.state);
    return result;
  }
  const state = await readFromCookie();
  return als.run({ state }, async () => {
    const result = await fn(state);
    await persist(state);
    return result;
  });
}

function currentState(fallback: LabState): LabState {
  return als.getStore()?.state ?? fallback;
}

export async function appendLabEvent(event: AuditEventInput): Promise<void> {
  await withLabState((state) => {
    const row: CompactEvent = {
      i: randomUUID(),
      e: event.event,
      t: Date.now(),
    };
    if (event.actorUserId) row.u = event.actorUserId;
    if (event.orgId) row.o = event.orgId;
    if (event.resourceType) row.r = event.resourceType;
    if (event.resourceId) row.d = event.resourceId;
    state.ev.unshift(row);
    if (state.ev.length > MAX_EVENTS) state.ev.length = MAX_EVENTS;
  });
}

export function labEventsToRows(state: LabState): AuditRow[] {
  return state.ev.map((row) => ({
    id: row.i,
    event: row.e,
    createdAt: new Date(row.t),
    actorUserId: row.u ?? null,
    orgId: row.o ?? null,
    resourceType: row.r ?? null,
    resourceId: row.d ?? null,
    ip: null,
    userAgent: null,
    metadata: null,
  }));
}

export async function readLabEvents(): Promise<AuditRow[]> {
  return labEventsToRows(currentState(await readFromCookie()));
}

export async function listLabOrgs(): Promise<LabOrg[]> {
  return currentState(await readFromCookie()).orgs;
}

export async function listLabMembers(orgId: string): Promise<LabMember[]> {
  return currentState(await readFromCookie()).members.filter(
    (m) => m.orgId === orgId,
  );
}

export async function getLabMembership(
  orgId: string,
  userId: string,
): Promise<LabMember | null> {
  return (
    currentState(await readFromCookie()).members.find(
      (m) => m.orgId === orgId && m.userId === userId,
    ) ?? null
  );
}

export async function addLabOrganization(input: {
  name: string;
  slug: string;
  userId: string;
  email: string | null;
  displayName: string | null;
}): Promise<LabOrg> {
  return withLabState((state) => {
    let slug = input.slug;
    if (state.orgs.some((o) => o.slug === slug)) {
      slug = `${input.slug}-${randomUUID().slice(0, 4)}`;
    }
    const org: LabOrg = {
      id: randomUUID(),
      name: input.name,
      slug,
      role: "owner",
      createdAt: new Date().toISOString(),
    };
    state.orgs.unshift(org);
    state.members.unshift({
      userId: input.userId,
      orgId: org.id,
      email: input.email ?? "",
      name: input.displayName ?? input.email ?? "owner",
      role: "owner",
    });
    return org;
  });
}

export async function addLabMember(input: {
  orgId: string;
  email: string;
  role: Exclude<OrgRole, "owner">;
}): Promise<LabMember> {
  return withLabState((state) => {
    const existing = state.members.find(
      (m) => m.orgId === input.orgId && m.email === input.email,
    );
    if (existing) return existing;
    const member: LabMember = {
      userId: randomUUID(),
      orgId: input.orgId,
      email: input.email,
      name: input.email.split("@")[0] ?? input.email,
      role: input.role,
    };
    state.members.push(member);
    return member;
  });
}

function expandScan(row: CompactScan): LabScan {
  const grades = ["A", "B", "C", "D", "F"] as const;
  return {
    id: row.i,
    projectLabel: row.p || "workspace",
    overallScore: row.s,
    grade: grades.includes(row.g) ? row.g : "C",
    summary: row.m ?? "",
    findingCount: row.n ?? 0,
    source: row.c || "ui",
    createdAt: new Date(row.t).toISOString(),
    findings: (Array.isArray(row.f) ? row.f : []).map((f) => ({
      severity: f.v,
      title: f.t,
    })),
  };
}

function emptyScans(): ScanJar {
  return { scans: [] };
}

function decodeScans(raw: string | undefined, key: string): ScanJar {
  const parsed = unsign(raw, key) as ScanJar | null;
  if (!parsed || !Array.isArray(parsed.scans)) return emptyScans();
  return { scans: parsed.scans };
}

async function readScanJar(): Promise<ScanJar> {
  const key = secret();
  if (!key) return emptyScans();
  const jar = await cookies();
  return decodeScans(jar.get(scanCookieName())?.value, key);
}

async function persistScans(state: ScanJar): Promise<void> {
  const key = secret();
  if (!key) return;
  const jar = await cookies();
  jar.set(scanCookieName(), encode(state, key), cookieOpts(MAX_AGE));
}

export async function listLabScans(): Promise<LabScan[]> {
  return (await readScanJar()).scans.map(expandScan);
}

export async function addLabScan(input: {
  projectLabel: string;
  overallScore: number;
  grade: LabScan["grade"];
  summary: string;
  findingCount: number;
  source: string;
  findings: Array<{ severity: string; title: string }>;
}): Promise<LabScan> {
  const key = secret();
  if (!key) {
    throw new Error("AUTH_SECRET is required to store lab scans.");
  }
  const state = await readScanJar();
  const row: CompactScan = {
    i: randomUUID(),
    p: input.projectLabel.slice(0, 80),
    s: input.overallScore,
    g: input.grade,
    m: input.summary.slice(0, 160),
    n: input.findingCount,
    c: input.source.slice(0, 24),
    t: Date.now(),
    f: input.findings.slice(0, 6).map((f) => ({
      v: f.severity.slice(0, 12),
      t: f.title.slice(0, 96),
    })),
  };
  state.scans.unshift(row);
  if (state.scans.length > MAX_SCANS) state.scans.length = MAX_SCANS;
  await persistScans(state);
  return expandScan(row);
}

export async function clearLabState(): Promise<void> {
  const jar = await cookies();
  jar.set(cookieName(), "", cookieOpts(0));
  jar.set(scanCookieName(), "", cookieOpts(0));
}
