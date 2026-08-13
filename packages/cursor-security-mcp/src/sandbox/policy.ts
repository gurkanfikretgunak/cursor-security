/**
 * Agent sandbox / kill-switch policy helpers (reference implementation).
 * Wire these into your agent runtime — they do not execute containers themselves.
 */

export type AgentSandboxPolicy = {
  /** Allowlisted outbound hosts (empty = deny all non-local). */
  egressAllowlist: string[];
  /** Max tool calls per run. */
  maxToolCalls: number;
  /** Max wall-clock ms per run. */
  maxDurationMs: number;
  /** Tools that always require human approval. */
  approvalRequiredTools: string[];
  /** Hard deny list. */
  deniedTools: string[];
};

export const DEFAULT_SANDBOX_POLICY: AgentSandboxPolicy = {
  egressAllowlist: ["api.github.com", "registry.npmjs.org"],
  maxToolCalls: 40,
  maxDurationMs: 10 * 60_000,
  approvalRequiredTools: ["bash", "shell", "exec", "write_file", "git_push"],
  deniedTools: ["rm_rf", "exfiltrate"],
};

export type ToolGateDecision =
  | { allow: true }
  | { allow: false; reason: string; requiresApproval?: boolean };

export function gateAgentTool(
  toolName: string,
  policy: AgentSandboxPolicy = DEFAULT_SANDBOX_POLICY,
  opts: { approved?: boolean; toolCallCount?: number; startedAtMs?: number } = {},
): ToolGateDecision {
  const name = toolName.toLowerCase();
  if (policy.deniedTools.some((t) => name.includes(t.toLowerCase()))) {
    return { allow: false, reason: "tool_denied" };
  }
  if ((opts.toolCallCount ?? 0) >= policy.maxToolCalls) {
    return { allow: false, reason: "max_tool_calls" };
  }
  if (
    opts.startedAtMs &&
    Date.now() - opts.startedAtMs > policy.maxDurationMs
  ) {
    return { allow: false, reason: "max_duration" };
  }
  if (
    policy.approvalRequiredTools.some((t) => name.includes(t.toLowerCase())) &&
    !opts.approved
  ) {
    return {
      allow: false,
      reason: "approval_required",
      requiresApproval: true,
    };
  }
  return { allow: true };
}

/** Kill switch: revoke tokens / stop scheduling — call from your control plane. */
export function createKillSwitch(state: { halted: boolean }) {
  return {
    halt(reason: string) {
      state.halted = true;
      return { halted: true, reason, at: new Date().toISOString() };
    },
    isHalted() {
      return state.halted;
    },
    resume() {
      state.halted = false;
    },
  };
}
