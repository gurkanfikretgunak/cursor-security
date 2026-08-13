export function BarChart({
  title,
  caption,
  rows,
}: {
  title: string;
  caption: string;
  rows: Array<{ name: string; value: number; max?: number }>;
}) {
  const peak = Math.max(...rows.map((row) => row.max ?? 100), 1);

  return (
    <figure className="border border-line px-4 py-4">
      <figcaption className="font-medium">{title}</figcaption>
      <p className="mt-1 font-mono text-[11px] text-muted">{caption}</p>
      <ul className="mt-4 space-y-3">
        {rows.map((row) => {
          const max = row.max ?? peak;
          const width = Math.max(2, Math.round((row.value / max) * 100));
          return (
            <li key={row.name}>
              <div className="flex items-baseline justify-between gap-3 font-mono text-[11px]">
                <span className="text-foreground">{row.name}</span>
                <span className="tabular-nums text-muted">
                  {row.max ? `${row.value}/${row.max}` : `${row.value}%`}
                </span>
              </div>
              <div className="mt-1 h-2 bg-surface">
                <div
                  className="h-2 bg-accent"
                  style={{ width: `${width}%` }}
                  aria-hidden
                />
              </div>
            </li>
          );
        })}
      </ul>
    </figure>
  );
}
