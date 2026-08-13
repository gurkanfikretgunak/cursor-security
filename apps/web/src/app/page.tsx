import Link from "next/link";
import { BackendStatus } from "@/components/backend-status";
import { CursorMark } from "@/components/cursor-mark";
import { HeroParallel } from "@/components/hero-parallel";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import {
  FRAMING,
  MIN_CONTROLS,
  MCP_DOMAINS,
  PRINCIPLES,
  SOURCES,
  THREATS,
} from "@/lib/site-content";

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
            write code, and move data. Treat that like production software with
            real side effects.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <a
              href="#principles"
              className="inline-flex h-11 items-center bg-foreground px-5 text-sm font-medium text-white hover:bg-black"
            >
              Ten principles
            </a>
            <Link
              href="/security"
              className="inline-flex h-11 items-center border border-line px-5 font-mono text-sm text-foreground hover:border-foreground"
            >
              Security
            </Link>
            <Link
              href="/login"
              className="inline-flex h-11 items-center border border-line px-5 font-mono text-sm text-foreground hover:border-foreground"
            >
              Open the lab
            </Link>
            <a
              href="/MANIFEST.md"
              className="inline-flex h-11 items-center border border-line px-5 font-mono text-sm text-foreground hover:border-foreground"
            >
              MANIFEST.md
            </a>
          </div>
          <BackendStatus />
          <HeroParallel />
        </section>

        <section className="mt-16 border-t border-line pt-12">
          <h2 className="text-2xl font-semibold tracking-tight text-foreground">
            Why this exists
          </h2>
          <div className="mt-5 space-y-4 text-[17px] leading-8 text-muted">
            <p>
              Most AI security talk still centers on the model prompt. Agentic
              systems are different: they choose tools, keep memory, and take
              actions across your stack. The risk is not only a bad answer — it
              is an unauthorized write, a leaked secret, or a confused deputy
              with too much power.
            </p>
            <p>
              This monorepo turns that argument into a public{" "}
              <a href="/MANIFEST.md" className="underline hover:text-foreground">
                manifesto
              </a>
              , a working Next.js control surface,{" "}
              <code className="rounded bg-surface px-1.5 py-0.5 font-mono text-[15px] text-foreground">
                masterfabric-next-sec
              </code>
              , a Cursor Security MCP, and an ISMS pack under{" "}
              <code className="rounded bg-surface px-1.5 py-0.5 font-mono text-[15px] text-foreground">
                compliance/
              </code>{" "}
              mapped to{" "}
              <a
                href="https://www.aicpa-cima.com/topic/audit-assurance/audit-and-assurance-greater-than-soc-2"
                className="underline hover:text-foreground"
              >
                SOC 2
              </a>
              ,{" "}
              <a
                href="https://www.iso.org/standard/27001"
                className="underline hover:text-foreground"
              >
                ISO 27001
              </a>
              , and{" "}
              <a
                href="https://owasp.org/www-project-application-security-verification-standard/"
                className="underline hover:text-foreground"
              >
                OWASP ASVS L2
              </a>
              .
            </p>
          </div>
        </section>

        <section className="mt-16 border-t border-line pt-12">
          <h2 className="text-2xl font-semibold tracking-tight text-foreground">
            Old framing vs agentic framing
          </h2>
          <p className="mt-3 text-[17px] leading-8 text-muted">
            Chatbots answer. Agents act. Once a model can write, you are shipping
            production software with blast radius.
          </p>
          <div className="mt-8 overflow-x-auto border border-line">
            <table className="w-full text-left text-[15px] leading-7">
              <thead className="bg-surface font-mono text-[11px] uppercase tracking-[0.08em] text-muted">
                <tr>
                  <th className="px-4 py-3 font-medium">Old</th>
                  <th className="px-4 py-3 font-medium">Agentic</th>
                </tr>
              </thead>
              <tbody>
                {FRAMING.map((row) => (
                  <tr key={row.old} className="border-t border-line">
                    <td className="px-4 py-3 text-muted">{row.old}</td>
                    <td className="px-4 py-3 text-foreground">{row.next}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section id="principles" className="mt-16 border-t border-line pt-12">
          <h2 className="text-2xl font-semibold tracking-tight text-foreground">
            Ten principles
          </h2>
          <p className="mt-3 text-[17px] leading-8 text-muted">
            Full prose lives in{" "}
            <a href="/MANIFEST.md" className="underline hover:text-foreground">
              MANIFEST.md
            </a>
            . Start where capability meets side effects — before model quality,
            after identity.
          </p>
          <ol className="mt-10 space-y-8">
            {PRINCIPLES.map((item, index) => (
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
                <p className="mt-2 font-mono text-[11px] text-muted">
                  Source:{" "}
                  <a
                    href={item.href}
                    className="underline hover:text-foreground"
                    rel="noreferrer"
                    target="_blank"
                  >
                    {item.source}
                  </a>
                </p>
              </li>
            ))}
          </ol>
        </section>

        <section id="threats" className="mt-16 border-t border-line pt-12">
          <h2 className="text-2xl font-semibold tracking-tight text-foreground">
            Threat catalog
          </h2>
          <p className="mt-3 text-[17px] leading-8 text-muted">
            Watch these paths first when you review an agent before production.
          </p>
          <ul className="mt-8 space-y-0 border border-line">
            {THREATS.map((threat) => (
              <li
                key={threat.title}
                className="border-b border-line px-5 py-4 last:border-b-0"
              >
                <p className="font-medium">{threat.title}</p>
                <p className="mt-1 text-[15px] leading-7 text-muted">
                  {threat.body}
                </p>
                <a
                  href={threat.href}
                  className="mt-2 inline-block font-mono text-[11px] underline hover:text-foreground"
                  rel="noreferrer"
                  target="_blank"
                >
                  Source
                </a>
              </li>
            ))}
          </ul>
        </section>

        <section id="controls" className="mt-16 border-t border-line pt-12">
          <h2 className="text-2xl font-semibold tracking-tight text-foreground">
            Minimum controls
          </h2>
          <p className="mt-3 text-[17px] leading-8 text-muted">
            The floor before production agents — from the manifesto.
          </p>
          <ul className="mt-8 grid gap-3 sm:grid-cols-2">
            {MIN_CONTROLS.map((control) => (
              <li key={control.name} className="border border-line px-4 py-4">
                <p className="font-medium">{control.name}</p>
                <p className="mt-1 text-[15px] leading-7 text-muted">
                  {control.expect}
                </p>
              </li>
            ))}
          </ul>
        </section>

        <section id="mcp" className="mt-16 border-t border-line pt-12">
          <h2 className="text-2xl font-semibold tracking-tight text-foreground">
            Security MCP for Cursor
          </h2>
          <p className="mt-3 text-[17px] leading-8 text-muted">
            <code className="font-mono text-sm">@cursor-security/mcp</code>{" "}
            scores a repository across seven domains, then the same chat can
            fix the findings. Ingest results at{" "}
            <Link href="/app/scans" className="underline hover:text-foreground">
              /app/scans
            </Link>
            .
          </p>
          <ul className="mt-8 space-y-3">
            {MCP_DOMAINS.map((domain) => (
              <li
                key={domain.name}
                className="flex flex-col gap-1 border border-line px-4 py-3 sm:flex-row sm:items-baseline sm:justify-between"
              >
                <span className="font-medium">
                  {domain.name}{" "}
                  <span className="font-mono text-[11px] text-muted">
                    {domain.checks} checks
                  </span>
                </span>
                <span className="text-[15px] text-muted">{domain.body}</span>
              </li>
            ))}
          </ul>
        </section>

        <section id="sources" className="mt-16 border-t border-line pt-12">
          <h2 className="text-2xl font-semibold tracking-tight text-foreground">
            Sources & further reading
          </h2>
          <p className="mt-3 text-[17px] leading-8 text-muted">
            Arguments on this site cite the same index as the repository README.
          </p>
          <ul className="mt-8 columns-1 gap-x-8 sm:columns-2">
            {SOURCES.map((source) => (
              <li key={source.href} className="mb-2 break-inside-avoid">
                <a
                  href={source.href}
                  className="font-mono text-sm underline hover:text-foreground"
                  rel={source.href.startsWith("http") ? "noreferrer" : undefined}
                  target={source.href.startsWith("http") ? "_blank" : undefined}
                >
                  {source.name}
                </a>
              </li>
            ))}
          </ul>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
