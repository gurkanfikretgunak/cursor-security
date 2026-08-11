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
        <div className="flex flex-col gap-1.5 font-mono text-xs text-muted sm:gap-1">
          <span>{left}</span>
          <span>
            Author{" "}
            <a
              href="https://github.com/gurkanfikretgunak"
              target="_blank"
              rel="noopener noreferrer"
              className="text-foreground underline-offset-2 hover:underline"
            >
              Gürkan Fikret Günak
            </a>
            <span className="text-muted"> · Cursor Ambassador</span>
          </span>
        </div>
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
