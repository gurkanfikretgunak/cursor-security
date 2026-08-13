import Link from "next/link";
import { BarChart } from "@/components/bar-chart";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import {
  CONTROL_COVERAGE,
  FRAMEWORKS,
  MCP_DOMAINS,
  MIN_CONTROLS,
} from "@/lib/site-content";

const subprocessors = [
  { name: "Vercel", purpose: "Application hosting / CDN", href: "https://vercel.com" },
  { name: "Render", purpose: "Optional API / Postgres when wired", href: "https://render.com" },
  { name: "Auth.js", purpose: "Session and credentials providers", href: "https://authjs.dev" },
];

export default function SecurityPage() {
  return (
    <div className="flex flex-1 flex-col bg-white">
      <SiteHeader />
      <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-14">
        <p className="font-mono text-xs font-medium uppercase tracking-[0.14em] text-accent">
          Trust center
        </p>
        <h1 className="mt-4 text-4xl font-semibold tracking-tight">Security</h1>
        <p className="mt-4 max-w-2xl text-[17px] leading-8 text-muted">
          Cursor Security is built against{" "}
          <a
            href="https://owasp.org/www-project-application-security-verification-standard/"
            className="underline hover:text-foreground"
            rel="noreferrer"
            target="_blank"
          >
            OWASP ASVS Level 2
          </a>{" "}
          technical controls and an in-repo ISMS pack mapped to{" "}
          <a
            href="https://www.aicpa-cima.com/topic/audit-assurance/audit-and-assurance-greater-than-soc-2"
            className="underline hover:text-foreground"
            rel="noreferrer"
            target="_blank"
          >
            SOC 2 Security
          </a>{" "}
          and{" "}
          <a
            href="https://www.iso.org/standard/27001"
            className="underline hover:text-foreground"
            rel="noreferrer"
            target="_blank"
          >
            ISO 27001
          </a>
          . Charts below are honest coverage of{" "}
          <em>this</em> teaching product — not a certification claim.
        </p>

        <section className="mt-14 grid gap-4 border-t border-line pt-10">
          <h2 className="text-2xl font-semibold">Coverage</h2>
          <p className="text-[16px] leading-7 text-muted">
            Implemented in the control surface vs documented-only runtime
            containment. Source:{" "}
            <a
              href="https://github.com/gurkanfikretgunak/cursor-security/blob/main/compliance/control-matrix.md"
              className="underline hover:text-foreground"
              rel="noreferrer"
              target="_blank"
            >
              control-matrix.md
            </a>
            .
          </p>
          <BarChart
            title="Control implementation"
            caption="Percent implemented in this repo · not a third-party score"
            rows={CONTROL_COVERAGE.map((row) => ({
              name: row.name,
              value: row.implemented,
            }))}
          />
          <BarChart
            title="MCP scanner domains"
            caption="Check counts in @cursor-security/mcp"
            rows={MCP_DOMAINS.map((row) => ({
              name: row.name,
              value: row.checks,
              max: 9,
            }))}
          />
        </section>

        <section className="mt-14 border-t border-line pt-10">
          <h2 className="text-2xl font-semibold">Controls in this product</h2>
          <ol className="mt-8 space-y-8">
            {MIN_CONTROLS.map((c, i) => (
              <li key={c.name}>
                <p className="font-mono text-xs text-accent">
                  {String(i + 1).padStart(2, "0")}
                </p>
                <h3 className="mt-1 text-lg font-semibold">{c.name}</h3>
                <p className="mt-2 text-[17px] leading-8 text-muted">{c.expect}</p>
              </li>
            ))}
          </ol>
        </section>

        <section className="mt-14 border-t border-line pt-10">
          <h2 className="text-2xl font-semibold">Framework map</h2>
          <ul className="mt-8 space-y-4">
            {FRAMEWORKS.map((item) => (
              <li key={item.name} className="border border-line px-4 py-4">
                <a
                  href={item.href}
                  className="font-medium underline hover:text-accent"
                  rel="noreferrer"
                  target="_blank"
                >
                  {item.name}
                </a>
                <p className="mt-1 text-[15px] leading-7 text-muted">{item.use}</p>
              </li>
            ))}
          </ul>
        </section>

        <section className="mt-14 border-t border-line pt-10">
          <h2 className="text-2xl font-semibold">Subprocessors</h2>
          <p className="mt-3 text-muted">
            Typical production dependencies for this deployment:
          </p>
          <ul className="mt-6 space-y-3 border border-line bg-surface px-5 py-5">
            {subprocessors.map((s) => (
              <li key={s.name} className="flex flex-col gap-1 sm:flex-row sm:gap-4">
                <a
                  href={s.href}
                  className="font-medium underline sm:w-56"
                  rel="noreferrer"
                  target="_blank"
                >
                  {s.name}
                </a>
                <span className="text-muted">{s.purpose}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="mt-14 border-t border-line pt-10">
          <h2 className="text-2xl font-semibold">Report a vulnerability</h2>
          <p className="mt-3 text-muted">
            Coordinated disclosure details:{" "}
            <Link
              href="/security/vulnerability-disclosure"
              className="underline hover:text-foreground"
            >
              vulnerability disclosure
            </Link>
            .
          </p>
          <p className="mt-6 text-sm text-muted">
            Privacy:{" "}
            <Link href="/privacy" className="underline">
              /privacy
            </Link>
            {" · "}
            Sources:{" "}
            <Link href="/#sources" className="underline">
              /#sources
            </Link>
          </p>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
