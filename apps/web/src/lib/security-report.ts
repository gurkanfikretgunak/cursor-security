export type AuditRow = {
  id: string;
  event: string;
  createdAt: Date;
  actorUserId: string | null;
  orgId: string | null;
  resourceType: string | null;
  resourceId: string | null;
  ip: string | null;
  userAgent: string | null;
  metadata: Record<string, unknown> | null;
};

export type ReportStep = {
  id: string;
  title: string;
  lesson: string;
  control: string;
  done: boolean;
  evidenceEvent?: string;
  at?: Date | null;
};

export type SecurityReport = {
  score: number;
  grade: "A" | "B" | "C" | "D" | "F";
  label: string;
  completed: number;
  total: number;
  steps: ReportStep[];
  eventCounts: Record<string, number>;
};

const GRADE_LABEL: Record<SecurityReport["grade"], string> = {
  A: "Strong security discipline",
  B: "Good progress — a few controls still open",
  C: "Identity established — finish org and audit drills",
  D: "Early stage — little practice beyond handshake/session",
  F: "Security lab has not started yet",
};

function gradeFromScore(score: number): SecurityReport["grade"] {
  if (score >= 90) return "A";
  if (score >= 75) return "B";
  if (score >= 55) return "C";
  if (score >= 30) return "D";
  return "F";
}

function latestEvent(events: AuditRow[], name: string): AuditRow | undefined {
  return events.find((e) => e.event === name);
}

/**
 * Cybersecurity education report card derived from live audit evidence.
 */
export function buildSecurityReport(input: {
  events: AuditRow[];
  hasOrg: boolean;
  memberCount: number;
  role?: string | null;
}): SecurityReport {
  const { events, hasOrg, memberCount, role } = input;

  const handshake = latestEvent(events, "auth.handshake");
  const device = latestEvent(events, "auth.device");
  const channel = latestEvent(events, "auth.channel");
  const blended = latestEvent(events, "auth.blended");
  const channelAccess = latestEvent(events, "auth.channel_access");
  const login = latestEvent(events, "auth.login");
  const orgCreated = latestEvent(events, "org.created");
  const memberAdded = latestEvent(events, "org.member_added");
  const failure = latestEvent(events, "auth.failure");

  const steps: ReportStep[] = [
    {
      id: "device",
      title: "01 · Anonymous device JWT",
      lesson:
        "The app issues an HttpOnly anonymous device JWT so every later call is bound to this browser/device.",
      control: "Device binding",
      done: Boolean(device) || Boolean(handshake),
      evidenceEvent: "auth.device",
      at: device?.createdAt ?? handshake?.createdAt ?? null,
    },
    {
      id: "handshake",
      title: "02 · Auth handshake + barrier",
      lesson:
        "CSRF-style handshake: public handshakeId plus HttpOnly barrier cookie. Magic link requires a matching pair.",
      control: "ASVS V3 / CSRF binding",
      done: Boolean(handshake) || Boolean(login),
      evidenceEvent: "auth.handshake",
      at: handshake?.createdAt ?? null,
    },
    {
      id: "pre-channel",
      title: "03 · Handshake-derived API channel",
      lesson:
        "A unique /api/c/<channel>/… path is derived from device + handshake. Only this device can preflight it.",
      control: "Path isolation",
      done: Boolean(channel) || Boolean(channelAccess),
      evidenceEvent: "auth.channel",
      at: channel?.createdAt ?? null,
    },
    {
      id: "session",
      title: "04 · Authentication (magic link)",
      lesson:
        "Passwordless database session + HttpOnly cookie. Server identity is authoritative.",
      control: "ASVS V2 Authentication",
      done: Boolean(login),
      evidenceEvent: "auth.login",
      at: login?.createdAt ?? null,
    },
    {
      id: "blended",
      title: "05 · Blended JWT (user + barrier)",
      lesson:
        "After login, user id + device id + barrier fingerprint are blended into one JWT bound to your private channel.",
      control: "Token compounding",
      done: Boolean(blended),
      evidenceEvent: "auth.blended",
      at: blended?.createdAt ?? null,
    },
    {
      id: "channel-access",
      title: "06 · Private channel API call",
      lesson:
        "Successful GET on your personal channel proves device JWT + blended JWT + path binding.",
      control: "Channel authorization",
      done: Boolean(channelAccess),
      evidenceEvent: "auth.channel_access",
      at: channelAccess?.createdAt ?? null,
    },
    {
      id: "tenant",
      title: "07 · Tenant / organization",
      lesson:
        "Multi-tenant boundary: creating an org isolates blast radius.",
      control: "ISO A.8.3 Access restriction",
      done: hasOrg || Boolean(orgCreated),
      evidenceEvent: "org.created",
      at: orgCreated?.createdAt ?? null,
    },
    {
      id: "rbac",
      title: "08 · RBAC role (owner/admin/member)",
      lesson:
        "UI role is display only. Authorization is enforced with requireOrgRole.",
      control: "ASVS V4 Access control",
      done: Boolean(role),
      evidenceEvent: role ? `role:${role}` : undefined,
      at: orgCreated?.createdAt ?? login?.createdAt ?? null,
    },
    {
      id: "invite",
      title: "09 · Member invite (privilege path)",
      lesson:
        "Admin/owner invites need rate limit, audit, and ownership checks.",
      control: "SOC2 CC6.1 / least privilege",
      done: Boolean(memberAdded) || memberCount > 1,
      evidenceEvent: "org.member_added",
      at: memberAdded?.createdAt ?? null,
    },
    {
      id: "audit-trail",
      title: "10 · Audit trail visibility",
      lesson:
        "Handshake, device, channel, blend, and org events must be observable.",
      control: "ASVS V7 / ISO A.8.15 Logging",
      done: events.length >= 1,
      evidenceEvent: "audit_events",
      at: events[0]?.createdAt ?? null,
    },
    {
      id: "failure-awareness",
      title: "11 · Failed-auth awareness",
      lesson:
        "auth.failure / auth.channel_denied records signal abuse or mis-binding.",
      control: "SOC2 CC7.2 Monitoring",
      done: true,
      evidenceEvent: failure ? "auth.failure" : "none",
      at: failure?.createdAt ?? null,
    },
  ];

  const scored = steps.filter((s) => s.id !== "failure-awareness");
  const completed = scored.filter((s) => s.done).length;
  const total = scored.length;
  const score = Math.round((completed / total) * 100);
  const grade = gradeFromScore(score);

  const eventCounts: Record<string, number> = {};
  for (const e of events) {
    eventCounts[e.event] = (eventCounts[e.event] ?? 0) + 1;
  }

  return {
    score,
    grade,
    label: GRADE_LABEL[grade],
    completed,
    total,
    steps,
    eventCounts,
  };
}

export function describeAuditEvent(event: string): string {
  const map: Record<string, string> = {
    "auth.handshake": "Barrier handshake issued",
    "auth.device": "Anonymous device JWT issued",
    "auth.channel": "Device/user API channel derived",
    "auth.blended": "User JWT blended with barrier key",
    "auth.channel_access": "Private channel API authorized",
    "auth.channel_denied": "Private channel API denied",
    "auth.login": "Signed in",
    "auth.logout": "Signed out",
    "auth.failure": "Authentication failed",
    "org.created": "Organization created",
    "org.member_added": "Member invited",
    "org.member_removed": "Member removed",
    "org.role_changed": "Role changed",
    "rbac.denied": "Authorization denied",
    "admin.action": "Admin action",
    "data.export": "Data export",
    "security.scan.ingested": "Repository scan saved",
  };
  return map[event] ?? event;
}
