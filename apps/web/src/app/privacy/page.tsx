import Link from "next/link";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

export default function PrivacyPage() {
  return (
    <div className="flex flex-1 flex-col bg-white">
      <SiteHeader />
      <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-14">
        <p className="font-mono text-xs font-medium uppercase tracking-[0.14em] text-accent">
          Legal
        </p>
        <h1 className="mt-4 text-3xl font-semibold tracking-tight">Privacy</h1>
        <div className="mt-6 space-y-4 text-[17px] leading-8 text-muted">
          <p>
            This starter privacy notice covers the Cursor Security demo control surface.
            Replace with counsel-reviewed language before production.
          </p>
          <h2 className="pt-4 text-xl font-semibold text-foreground">
            Data we process
          </h2>
          <ul className="list-disc space-y-2 pl-5">
            <li>Account email and name for authentication</li>
            <li>Organization membership and roles</li>
            <li>Security audit events (login, invites, admin actions)</li>
            <li>Technical logs required to operate the service</li>
          </ul>
          <h2 className="pt-4 text-xl font-semibold text-foreground">
            Purpose
          </h2>
          <p>
            Provide the service, secure accounts, meet compliance obligations,
            and investigate abuse.
          </p>
          <h2 className="pt-4 text-xl font-semibold text-foreground">
            Retention
          </h2>
          <p>
            Session and audit retention follow{" "}
            <code className="font-mono text-sm">compliance/policies/logging.md</code>.
            Contact us to request account deletion.
          </p>
          <p>
            <Link href="/security" className="underline hover:text-foreground">
              Security
            </Link>
          </p>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
