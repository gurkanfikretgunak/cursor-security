import { AsyncLocalStorage } from "node:async_hooks";
import { createHmac, randomUUID, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import type { AuditEventInput } from "masterfabric-next-sec/audit";
import type { OrgRole } from "masterfabric-next-sec/auth";
import type { AuditRow } from "@/lib/security-report";

const MAX_EVENTS = 60;
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

function secret(): string | null {
  return process.env.AUTH_SECRET || null;
}

function empty(): LabState {
  return { ev: [], orgs: [], members: [] };
}

function encode(state: LabState, key: string): string {
  const payload = Buffer.from(JSON.stringify(state), "utf8").toString(
    "base64url",
  );
  const sig = createHmac("sha256", key).update(payload).digest("base64url");
  return `${payload}.${sig}`;
}

function decode(raw: string | undefined, key: string): LabState {
  if (!raw) return empty();
  const dot = raw.lastIndexOf(".");
  if (dot <= 0) return empty();
  const payload = raw.slice(0, dot);
  const sig = raw.slice(dot + 1);
  const expected = createHmac("sha256", key).update(payload).digest("base64url");
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return empty();
  try {
    const parsed = JSON.parse(
      Buffer.from(payload, "base64url").toString("utf8"),
    ) as LabState;
    return {
      ev: Array.isArray(parsed.ev) ? parsed.ev : [],
      orgs: Array.isArray(parsed.orgs) ? parsed.orgs : [],
      members: Array.isArray(parsed.members) ? parsed.members : [],
    };
  } catch {
    return empty();
  }
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
  jar.set(cookieName(), encode(state, key), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    secure: process.env.NODE_ENV === "production",
    maxAge: MAX_AGE,
  });
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

export async function clearLabState(): Promise<void> {
  const jar = await cookies();
  jar.set(cookieName(), "", {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    secure: process.env.NODE_ENV === "production",
    maxAge: 0,
  });
}
