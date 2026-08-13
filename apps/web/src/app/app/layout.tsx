import Link from "next/link";
import { CursorMark } from "@/components/cursor-mark";
import { SiteFooter } from "@/components/site-footer";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-full flex-1 flex-col bg-white">
      <header className="border-b border-line">
        <div className="mx-auto flex w-full max-w-3xl items-center justify-between px-6 py-4">
          <Link
            href="/app"
            className="inline-flex items-center gap-2 font-mono text-sm font-semibold tracking-tight"
          >
            <CursorMark size={16} />
            <span>cursor security / report</span>
          </Link>
          <nav className="flex gap-4 text-sm text-muted">
            <Link href="/app" className="hover:text-foreground">
              X-ray
            </Link>
            <Link href="/app/scans" className="hover:text-foreground">
              Scans
            </Link>
            <Link href="/" className="hover:text-foreground">
              Site
            </Link>
            <Link href="/security" className="hover:text-foreground">
              Security
            </Link>
          </nav>
        </div>
      </header>
      {children}
      <SiteFooter left="cursor security / report" />
    </div>
  );
}
