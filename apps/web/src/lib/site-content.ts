export const PRINCIPLES = [
  {
    title: "Least agency",
    body: "Grant only the tools, scopes, and side effects an agent needs for a defined job. Prefer read over write, draft over commit, and human approval for irreversible steps.",
    source: "OWASP LLM — Excessive Agency",
    href: "https://owasp.org/www-project-top-10-for-large-language-model-applications/",
  },
  {
    title: "Identity before action",
    body: "Every agent run needs a named principal, authenticated credentials, and an auditable session. No anonymous production tool use.",
    source: "OWASP ASVS V2 / V3",
    href: "https://owasp.org/www-project-application-security-verification-standard/",
  },
  {
    title: "Tool trust is zero by default",
    body: "MCP servers, plugins, and browsers are supply chain. Pin versions, review reach, isolate network and filesystem.",
    source: "Model Context Protocol",
    href: "https://modelcontextprotocol.io/",
  },
  {
    title: "Prompt is not policy",
    body: "Natural language can be ignored or injected. Enforce authorization in code, gateways, and runtime policy — not only in the system prompt.",
    source: "OWASP ASVS V4 Access Control",
    href: "https://owasp.org/www-project-application-security-verification-standard/",
  },
  {
    title: "Human control for high impact",
    body: "Destructive, external, financial, or privacy-sensitive actions need explicit confirmation or dual control.",
    source: "NIST AI RMF Measure / Manage",
    href: "https://www.nist.gov/itl/ai-risk-management-framework",
  },
  {
    title: "Observable by design",
    body: "Log plans, tool calls, approvals, denials, and outcomes. You cannot investigate what you did not record.",
    source: "OWASP ASVS V7",
    href: "https://owasp.org/www-project-application-security-verification-standard/",
  },
  {
    title: "Memory is sensitive data",
    body: "Embeddings and long-term memory are confidential stores. Apply retention, redaction, ACL, and tenant isolation.",
    source: "OWASP LLM — Sensitive Information Disclosure",
    href: "https://owasp.org/www-project-top-10-for-large-language-model-applications/",
  },
  {
    title: "Contain blast radius",
    body: "Sandbox, egress allowlist, rate limits, budgets, kill switch. A compromised run must not take down the estate.",
    source: "NIST AI RMF",
    href: "https://www.nist.gov/itl/ai-risk-management-framework",
  },
  {
    title: "Evaluate adversarially",
    body: "Test continuously for injection, tool abuse, exfiltration, and goal hijacking.",
    source: "OWASP LLM01 Prompt Injection",
    href: "https://genai.owasp.org/llmrisk/llm01-prompt-injection/",
  },
  {
    title: "Ship with ownership",
    body: "Every production agent has a named owner, an incident path, and a retirement plan.",
    source: "Incident response policy",
    href: "https://github.com/gurkanfikretgunak/cursor-security/blob/main/compliance/policies/incident-response.md",
  },
] as const;

export const FRAMING = [
  { old: "Did the model answer safely?", next: "Did the agent take an authorized action?" },
  { old: "Prompt policy as the main control", next: "Code, gateway, and runtime policy as enforcement" },
  { old: "Risk ≈ harmful text", next: "Risk ≈ unauthorized write, secret leak, confused deputy, cost runaway" },
  { old: "One chat session", next: "Identity, tools, memory, approvals, audit, kill switch" },
] as const;

export const THREATS = [
  {
    title: "Prompt / indirect injection",
    body: "Attacker-controlled docs, tickets, or pages rewrite goals.",
    href: "https://genai.owasp.org/llmrisk/llm01-prompt-injection/",
  },
  {
    title: "Over-privileged tools",
    body: "One write tool plus injection becomes damage.",
    href: "https://owasp.org/www-project-top-10-for-large-language-model-applications/",
  },
  {
    title: "Confused deputy",
    body: "The agent spends your authority on an attacker’s goal.",
    href: "https://en.wikipedia.org/wiki/Confused_deputy_problem",
  },
  {
    title: "Secret leakage",
    body: "Tokens and PII leave via logs, traces, or model output.",
    href: "https://owasp.org/www-project-top-10-for-large-language-model-applications/",
  },
  {
    title: "Unbounded loops / cost",
    body: "Tool-calling recursion until money or systems break.",
    href: "https://www.nist.gov/itl/ai-risk-management-framework",
  },
  {
    title: "Supply chain",
    body: "Bad model, MCP server, or package with your privileges.",
    href: "https://modelcontextprotocol.io/",
  },
  {
    title: "Cross-tenant bleed",
    body: "Shared platforms leak context across tenants.",
    href: "https://owasp.org/www-project-application-security-verification-standard/",
  },
  {
    title: "Session takeover",
    body: "Stolen cookie or magic-link spam, higher impact if agent-linked.",
    href: "https://owasp.org/www-project-application-security-verification-standard/",
  },
] as const;

export const MIN_CONTROLS = [
  { name: "AuthN / AuthZ", expect: "Strong identity; per-tool authorization" },
  { name: "Sandbox", expect: "Isolated execution for code and shell tools" },
  { name: "Network", expect: "Allowlisted egress only" },
  { name: "Secrets", expect: "Vaulted; never in prompts by default" },
  { name: "Approvals", expect: "Required for high-impact actions" },
  { name: "Audit", expect: "Immutable trail of decisions and tool use" },
  { name: "Kill switch", expect: "Immediate revoke and halt" },
] as const;

export const MCP_DOMAINS = [
  { name: "Secrets", checks: 7, body: "Hardcoded keys, JWTs, private keys, committed env files" },
  { name: "Client", checks: 8, body: "XSS sinks, token-in-localStorage, CSP, insecure HTTP" },
  { name: "Backend", checks: 9, body: "SQLi/command patterns, CORS *, auth gaps, cookie flags" },
  { name: "Dependencies", checks: 8, body: "Lockfiles, risky packages, floating versions, OSV" },
  { name: "Config", checks: 8, body: "gitignore, Docker USER, CI jobs, headers, npmrc tokens" },
  { name: "Project", checks: 5, body: "README, license, tests, engines, TypeScript strictness" },
  { name: "Agent", checks: 6, body: "Auto-approve, shell tools, dangerous MCP flags, sandbox" },
] as const;

export const CONTROL_COVERAGE = [
  { name: "Identity & sessions", implemented: 95, note: "Auth.js + handshake + blended JWT" },
  { name: "Authorization", implemented: 92, note: "requireUser / requireOrgRole on actions" },
  { name: "Input validation", implemented: 90, note: "Zod actionHandler / apiHandler" },
  { name: "Audit trail", implemented: 88, note: "Typed events, live timeline, lab cookie" },
  { name: "Headers / CSP", implemented: 85, note: "CSP + HSTS in production" },
  { name: "Rate limiting", implemented: 78, note: "Auth / sensitive presets" },
  { name: "Repo scanners", implemented: 82, note: "Seven MCP domains + /app/scans" },
  { name: "Sandbox / egress", implemented: 35, note: "Documented; not a full runtime product" },
] as const;

export const FRAMEWORKS = [
  {
    name: "OWASP ASVS L2",
    use: "Technical bar for auth, sessions, validation, headers, logging",
    href: "https://owasp.org/www-project-application-security-verification-standard/",
  },
  {
    name: "OWASP LLM Top 10",
    use: "Agent risk vocabulary: injection, excessive agency, SSRF via tools",
    href: "https://owasp.org/www-project-top-10-for-large-language-model-applications/",
  },
  {
    name: "NIST AI RMF",
    use: "Govern / Map / Measure / Manage language for agent operations",
    href: "https://www.nist.gov/itl/ai-risk-management-framework",
  },
  {
    name: "SOC 2",
    use: "Trust services narrative and evidence cadence",
    href: "https://www.aicpa-cima.com/topic/audit-assurance/audit-and-assurance-greater-than-soc-2",
  },
  {
    name: "ISO/IEC 27001",
    use: "ISMS spine: scope, SoA, policies, risk",
    href: "https://www.iso.org/standard/27001",
  },
  {
    name: "NIST SSDF",
    use: "Secure software development framing for SDLC policy",
    href: "https://csrc.nist.gov/pubs/sp/800/218/final",
  },
] as const;

export const SOURCES = [
  { name: "Manifest", href: "/MANIFEST.md" },
  { name: "ISMS index", href: "https://github.com/gurkanfikretgunak/cursor-security/blob/main/compliance/README.md" },
  { name: "Threat model", href: "https://github.com/gurkanfikretgunak/cursor-security/blob/main/compliance/threat-model.md" },
  { name: "Control matrix", href: "https://github.com/gurkanfikretgunak/cursor-security/blob/main/compliance/control-matrix.md" },
  { name: "Security library", href: "https://github.com/gurkanfikretgunak/cursor-security/tree/main/packages/masterfabric-next-sec" },
  { name: "Security MCP", href: "https://github.com/gurkanfikretgunak/cursor-security/tree/main/packages/cursor-security-mcp" },
  { name: "OWASP ASVS", href: "https://owasp.org/www-project-application-security-verification-standard/" },
  { name: "OWASP LLM Top 10", href: "https://owasp.org/www-project-top-10-for-large-language-model-applications/" },
  { name: "NIST AI RMF", href: "https://www.nist.gov/itl/ai-risk-management-framework" },
  { name: "Model Context Protocol", href: "https://modelcontextprotocol.io/" },
  { name: "Auth.js", href: "https://authjs.dev" },
  { name: "Cursor brand", href: "https://cursor.com/brand" },
] as const;
