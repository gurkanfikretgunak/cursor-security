# Agentic AI Security Manifest

A short public statement for teams building, deploying, and operating agentic AI systems.

## Purpose

Agentic systems do not only answer questions. They plan, call tools, write code, move data, and act across systems. Security for agents must cover intent, capability, memory, and action — not only the model prompt.

## Principles

1. **Least agency** — Grant only the tools, scopes, and side effects an agent needs for a defined job. Prefer read over write; prefer draft over commit; prefer human approval for irreversible steps.
2. **Identity before action** — Every agent run must have a clear principal (user, service, or workflow), authenticated credentials, and an auditable session boundary.
3. **Tool trust is zero by default** — Treat tools, MCP servers, plugins, and connectors as untrusted until reviewed. Pin versions, validate inputs and outputs, and isolate network and filesystem reach.
4. **Prompt is not a policy** — Natural-language instructions are guidance, not enforcement. Enforce authorization in code, gateways, and runtime policy engines.
5. **Human control for high impact** — Destructive, external, financial, or privacy-sensitive actions require explicit human confirmation or dual control.
6. **Observable by design** — Log plans, tool calls, approvals, denials, and outcomes. Retain enough context to investigate misuse without storing secrets in clear text.
7. **Memory is sensitive data** — Treat long-term memory, embeddings, and retrieved context as confidential. Apply retention limits, redaction, and access control.
8. **Contain blast radius** — Run agents in sandboxes with egress controls, rate limits, budgets, and kill switches. Assume compromise of a single run must not take down the estate.
9. **Evaluate adversarial behavior** — Continuously test for prompt injection, tool abuse, confused deputy paths, data exfiltration, and goal hijacking.
10. **Ship with ownership** — Every production agent has a named owner, an incident path, and a retirement plan when risk outweighs value.

## Threat Focus

- Prompt injection and indirect injection via retrieved content
- Over-privileged tools and confused deputy attacks
- Secret leakage through logs, traces, or model outputs
- Unbounded loops, cost runaway, and resource exhaustion
- Supply-chain risk in models, tools, and agent frameworks
- Cross-tenant data bleed in shared agent platforms

## Minimum Controls

| Control | Expectation |
| --- | --- |
| AuthN / AuthZ | Strong identity; per-tool authorization checks |
| Sandbox | Isolated execution for code and shell tools |
| Network | Allowlisted egress only |
| Secrets | Vaulted credentials; never in prompts by default |
| Approvals | Required for high-impact actions |
| Audit | Immutable trail of agent decisions and tool use |
| Kill switch | Immediate revoke of tokens and halt of runs |

## Commitment

We treat agentic AI as production software with real side effects. Convenience never outranks containment. Capability grows only as fast as verification, observability, and human accountability.

---

*Version 1.0 — Agentic AI Security*
