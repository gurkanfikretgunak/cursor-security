import Link from "next/link";
import { auth } from "@/auth";
import { CursorMark } from "@/components/cursor-mark";

export async function SiteHeader() {
  const session = await auth();

  return (
    <header className="border-b border-line">
      <div className="mx-auto flex w-full max-w-3xl items-center justify-between px-6 py-5">
        <Link
          href="/"
          className="inline-flex items-center gap-2 font-mono text-sm font-semibold tracking-tight text-foreground"
        >
          <CursorMark size={18} />
          <span>cursor security</span>
        </Link>
        <nav className="flex items-center gap-5 text-sm text-muted">
          <Link href="/#principles" className="hover:text-foreground">
            Principles
          </Link>
          <Link href="/#threats" className="hover:text-foreground">
            Threats
          </Link>
          <Link href="/security" className="hover:text-foreground">
            Security
          </Link>
          <Link href="/#sources" className="hover:text-foreground">
            Sources
          </Link>
          {session?.user ? (
            <Link href="/app" className="hover:text-foreground">
              App
            </Link>
          ) : (
            <Link href="/login" className="hover:text-foreground">
              Login
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
