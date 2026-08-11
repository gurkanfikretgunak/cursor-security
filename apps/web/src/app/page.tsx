import Link from "next/link";
import { CursorMark } from "@/components/cursor-mark";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

const principles = [
  {
    title: "Least agency",
    body: "Grant only the tools, scopes, and side effects an agent needs for a defined job. Prefer read over write, draft over commit, and human approval for irreversible steps.",
  },
  {
    title: "Identity before action",
    body: "Every agent run needs a clear principal, authenticated credentials, and an auditable session boundary. No anonymous tool use in production.",
  },
  {
    title: "Prompt is not policy",
    body: "Natural-language instructions are guidance, not enforcement. Authorize tools in code, gateways, and runtime policy — not only in the system prompt.",
  },
  {
    title: "Contain blast radius",
    body: "Run agents in sandboxes with egress controls, rate limits, budgets, and a kill switch. A compromised run must not take down the estate.",
  },
];

const threats = [
  "Prompt injection and indirect injection via retrieved content",
  "Over-privileged tools and confused deputy attacks",
  "Secret leakage through logs, traces, or model outputs",
  "Unbounded loops, cost runaway, and resource exhaustion",
  "Supply-chain risk in models, tools, and agent frameworks",
];

export default function Home() {
  return (
    <div className="flex flex-1 flex-col bg-white">
      <SiteHeader />

      <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-14 md:py-20">
        <section>
          <p className="font-mono text-xs font-medium uppercase tracking-[0.14em] text-accent">
            Agentic AI Security
          </p>
          <h1 className="mt-4 flex items-center gap-3 text-4xl font-semibold tracking-tight text-foreground md:text-[2.75rem] md:leading-[1.15]">
            <CursorMark size={36} variant="cube-25d" className="shrink-0" />
            <span>Cursor Security</span>
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-8 text-muted md:text-xl md:leading-9">
            Security for AI that acts — not only answers. Agents plan, call tools,
            write code, and move data. Treat that like production software with real
            side effects.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <a
              href="#principles"
              className="inline-flex h-11 items-center bg-foreground px-5 text-sm font-medium text-white hover:bg-black"
            >
              Read principles
            </a>
            <Link
              href="/security"
              className="inline-flex h-11 items-center border border-line px-5 font-mono text-sm text-foreground hover:border-foreground"
            >
              Security
            </Link>
            <a
              href="/MANIFEST.md"
              className="inline-flex h-11 items-center border border-line px-5 font-mono text-sm text-foreground hover:border-foreground"
            >
              MANIFEST.md
            </a>
          </div>
        </section>

        <section className="mt-16 border-t border-line pt-12">
          <h2 className="text-2xl font-semibold tracking-tight text-foreground">
            Why this exists
          </h2>
          <div className="mt-5 space-y-4 text-[17px] leading-8 text-muted">
            <p>
              Most AI security talk still centers on the model prompt. Agentic systems
              are different: they choose tools, keep memory, and take actions across
              your stack. The risk is not only a bad answer — it is an unauthorized
              write, a leaked secret, or a confused deputy with too much power.
            </p>
            <p>
              Cursor Security ships with{" "}
              <code className="rounded bg-surface px-1.5 py-0.5 font-mono text-[15px] text-foreground">
                masterfabric-next-sec
              </code>{" "}
              and an ISMS pack under{" "}
              <code className="rounded bg-surface px-1.5 py-0.5 font-mono text-[15px] text-foreground">
                compliance/
              </code>{" "}
              mapped to SOC 2, ISO 27001, and OWASP ASVS L2.
            </p>
          </div>
        </section>

        <section id="principles" className="mt-16 border-t border-line pt-12">
          <h2 className="text-2xl font-semibold tracking-tight text-foreground">
            Four controls that matter first
          </h2>
          <p className="mt-3 text-[17px] leading-8 text-muted">
            Start where capability meets side effects — before model quality, after
            identity.
          </p>
          <ol className="mt-10 space-y-8">
            {principles.map((item, index) => (
              <li key={item.title}>
                <p className="font-mono text-xs font-medium text-accent">
                  {String(index + 1).padStart(2, "0")}
                </p>
                <h3 className="mt-1 text-lg font-semibold text-foreground">
                  {item.title}
                </h3>
                <p className="mt-2 max-w-2xl text-[17px] leading-8 text-muted">
                  {item.body}
                </p>
              </li>
            ))}
          </ol>
        </section>

        <section id="threats" className="mt-16 border-t border-line pt-12">
          <h2 className="text-2xl font-semibold tracking-tight text-foreground">
            Threat focus
          </h2>
          <p className="mt-3 text-[17px] leading-8 text-muted">
            Watch these paths first when you review an agent before production.
          </p>
          <ul className="mt-8 space-y-3 border border-line bg-surface px-5 py-5">
            {threats.map((threat) => (
              <li
                key={threat}
                className="flex gap-3 text-[16px] leading-7 text-foreground"
              >
                <span className="mt-2 h-1.5 w-1.5 shrink-0 bg-accent" aria-hidden />
                <span>{threat}</span>
              </li>
            ))}
          </ul>
        </section>

        <section id="manifest" className="mt-16 border-t border-line pt-12">
          <h2 className="text-2xl font-semibold tracking-tight text-foreground">
            Manifest
          </h2>
          <p className="mt-3 max-w-2xl text-[17px] leading-8 text-muted">
            Ten principles, a threat list, and minimum controls — plain markdown you
            can fork, cite, and ship with your agent stack.
          </p>
          <a
            href="/MANIFEST.md"
            className="mt-6 inline-flex h-11 items-center border border-line px-5 font-mono text-sm text-foreground hover:border-foreground"
          >
            Open MANIFEST.md →
          </a>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
