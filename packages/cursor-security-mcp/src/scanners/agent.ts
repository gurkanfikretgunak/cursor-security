import type { Finding } from "../types.js";
import { lineOfMatch, type SourceFile } from "../utils/fs.js";

/**
 * Agentic / MCP trust scanner — least agency, tool allowlists, sandbox signals.
 */
export function scanAgent(files: SourceFile[]): Finding[] {
  const findings: Finding[] = [];

  const mcpConfigs = files.filter((f) =>
    /(^|\/)(\.cursor\/)?mcp\.json$|claude_desktop_config\.json$/i.test(
      f.relativePath.replace(/\\/g, "/")
    )
  );

  for (const file of mcpConfigs) {
    if (/"command"\s*:\s*"npx"/i.test(file.content) && !/"args"\s*:\s*\[[^\]]*"-y"/i.test(file.content)) {
      findings.push({
        id: `agent-npx-mcp:${file.relativePath}`,
        domain: "agent",
        severity: "medium",
        title: "MCP server launched via npx without pin/allow signal",
        description: "Unpinned npx MCP servers can pull unexpected tool code at runtime.",
        file: file.relativePath,
        recommendation: "Pin package versions and review each MCP server before enabling tools.",
        ruleId: "agent-npx-unpinned",
      });
    }

    if (/"args"\s*:\s*\[[^\]]*--dangerously/i.test(file.content)) {
      findings.push({
        id: `agent-dangerous-flag:${file.relativePath}`,
        domain: "agent",
        severity: "high",
        title: "Dangerous MCP/CLI flag in agent config",
        description: "Config references a dangerously* flag that widens agent blast radius.",
        file: file.relativePath,
        recommendation: "Remove dangerous flags; prefer least agency and explicit allowlists.",
        ruleId: "agent-dangerous-flag",
      });
    }
  }

  const configFiles = files.filter((f) =>
    /\.(json|ya?ml|toml)$/i.test(f.relativePath) ||
    /(^|\/)(mcp\.json|agents?\.(md|json|ya?ml)|claude_desktop_config\.json)$/i.test(
      f.relativePath.replace(/\\/g, "/")
    )
  );

  for (const file of configFiles) {
    const { content, relativePath } = file;
    let match: RegExpExecArray | null;

    const shellTool =
      /\b(tools?|allowedTools|permissions)\b[\s\S]{0,120}\b(bash|shell|terminal|exec)\b/gi;
    while ((match = shellTool.exec(content)) !== null) {
      findings.push({
        id: `agent-shell-tool:${relativePath}:${match.index}`,
        domain: "agent",
        severity: "high",
        title: "Shell/exec tool capability referenced",
        description: "Agent configs that expose shell/exec tools need strict sandboxing and approval gates.",
        file: relativePath,
        line: lineOfMatch(content, match.index),
        recommendation: "Allowlist shell only for trusted jobs; require human approval for irreversible commands.",
        ruleId: "agent-shell-tool",
      });
      if (findings.length > 40) break;
    }

    if (
      /\b(autoApprove|auto_approve|yolo|alwaysAllow)\b/i.test(content) &&
      /\b(true|all|\*)\b/i.test(content)
    ) {
      findings.push({
        id: `agent-auto-approve:${relativePath}`,
        domain: "agent",
        severity: "critical",
        title: "Broad auto-approve for agent actions",
        description: "Auto-approve / always-allow settings remove human control for high-impact actions.",
        file: relativePath,
        recommendation: "Require confirmation for writes, network egress, and secret-bearing tools.",
        ruleId: "agent-auto-approve",
      });
    }

    if (/ignore.?prompt.?injection|disable.?guardrail/i.test(content)) {
      findings.push({
        id: `agent-guardrail-off:${relativePath}`,
        domain: "agent",
        severity: "high",
        title: "Prompt-injection / guardrail controls appear disabled",
        description: "Disabling injection defenses increases tool-abuse and goal-hijack risk.",
        file: relativePath,
        recommendation: "Keep injection defenses on; treat retrieved content as untrusted.",
        ruleId: "agent-guardrail-off",
      });
    }
  }

  const hasSandboxSignal = files.some((f) =>
    /sandbox|firecracker|gvisor|seccomp|egress.?allowlist|networkPolicy/i.test(f.content)
  );
  const hasAgentSurface = configFiles.some((f) =>
    /mcpServers|allowedTools|tool_choice/i.test(f.content)
  );

  if (hasAgentSurface && !hasSandboxSignal) {
    findings.push({
      id: "agent-missing-sandbox-signal",
      domain: "agent",
      severity: "medium",
      title: "Agent surface without sandbox / egress signal",
      description: "Agent or MCP configuration found, but no sandbox or egress-control references were detected.",
      recommendation: "Run agents in isolated environments with allowlisted egress and a kill switch.",
      ruleId: "agent-missing-sandbox",
    });
  }

  return findings;
}
