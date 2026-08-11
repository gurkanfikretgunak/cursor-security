import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { LoginForm } from "@/components/login-form";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string; error?: string }>;
}) {
  const session = await auth();
  if (session?.user) redirect("/app");

  const params = await searchParams;

  return (
    <div className="flex flex-1 flex-col bg-white">
      <SiteHeader />
      <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-14">
        <p className="font-mono text-xs font-medium uppercase tracking-[0.14em] text-accent">
          Sign in
        </p>
        <h1 className="mt-4 text-3xl font-semibold tracking-tight">
          Magic link login
        </h1>
        <p className="mt-3 max-w-xl text-[17px] leading-8 text-muted">
          Passwordless email sign-in with a one-time auth handshake + HttpOnly
          barrier cookie, session cookies, rate limits, and audit events — via{" "}
          <code className="font-mono text-sm">masterfabric-next-sec</code>.
        </p>
        {params.error ? (
          <p className="mt-4 border border-line px-3 py-2 text-sm text-red-700">
            Sign-in failed. Request a new magic link.
          </p>
        ) : null}
        <LoginForm callbackUrl={params.callbackUrl} />
        <p className="mt-8 text-sm text-muted">
          <Link href="/" className="underline hover:text-foreground">
            Back to Cursor Security
          </Link>
        </p>
      </main>
      <SiteFooter />
    </div>
  );
}
