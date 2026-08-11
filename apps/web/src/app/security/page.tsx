import Link from "next/link";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

const controls = [
  {
    title: "Identity & sessions",
    body: "Auth.js magic-link login, database sessions, HttpOnly cookies, idle/absolute timeouts via masterfabric-next-sec.",
  },
  {
    title: "Authorization",
    body: "Server-side requireUser / requireOrgRole on every mutating Server Action. UI is never the policy boundary.",
  },
  {
    title: "Input validation",
    body: "Zod schemas through actionHandler — invalid input never reaches business logic.",
  },
  {
    title: "Audit logging",
    body: "Append-oriented audit_events for auth, org, and RBAC outcomes — evidence for SOC 2 monitoring.",
  },
  {
    title: "Transport & headers",
    body: "CSP (report-only→enforce), nosniff, frame denial, referrer policy, HSTS in production.",
  },
  {
    title: "Rate limiting",
    body: "Auth and sensitive-action presets; memory store locally, Redis-ready interface for production.",
  },
];

const subprocessors = [
  { name: "Hosting (e.g. Vercel)", purpose: "Application hosting / CDN" },
  { name: "PostgreSQL provider", purpose: "Primary datastore & sessions" },
  { name: "Transactional email", purpose: "Magic-link delivery (when configured)" },
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
          Cursor Security is built against OWASP ASVS Level 2 technical controls and an
          in-repo ISMS pack mapped to SOC 2 Security and ISO 27001. See{" "}
          <code className="font-mono text-sm">compliance/</code> in the repository
          for auditor artifacts.
        </p>

        <section className="mt-14 border-t border-line pt-10">
          <h2 className="text-2xl font-semibold">Controls in this product</h2>
          <ol className="mt-8 space-y-8">
            {controls.map((c, i) => (
              <li key={c.title}>
                <p className="font-mono text-xs text-accent">
                  {String(i + 1).padStart(2, "0")}
                </p>
                <h3 className="mt-1 text-lg font-semibold">{c.title}</h3>
                <p className="mt-2 text-[17px] leading-8 text-muted">{c.body}</p>
              </li>
            ))}
          </ol>
        </section>

        <section className="mt-14 border-t border-line pt-10">
          <h2 className="text-2xl font-semibold">Subprocessors</h2>
          <p className="mt-3 text-muted">
            Typical production dependencies (update when your vendors change):
          </p>
          <ul className="mt-6 space-y-3 border border-line bg-surface px-5 py-5">
            {subprocessors.map((s) => (
              <li key={s.name} className="flex flex-col gap-1 sm:flex-row sm:gap-4">
                <span className="font-medium sm:w-56">{s.name}</span>
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
          </p>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
