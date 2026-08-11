import { CursorMark } from "@/components/cursor-mark";

type SiteFooterProps = {
  left?: string;
};

export function SiteFooter({
  left = "cursor security / agentic ai security",
}: SiteFooterProps) {
  return (
    <footer className="border-t border-line">
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-3 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
        <span className="font-mono text-xs text-muted">{left}</span>
        <a
          href="https://cursor.com"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 font-mono text-xs text-muted transition-colors hover:text-foreground"
        >
          <CursorMark size={14} />
          <span>Developed with Cursor</span>
        </a>
      </div>
    </footer>
  );
}
