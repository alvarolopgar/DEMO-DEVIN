interface Row {
  name: string;
  value: string;
  color?: string;
}

/** Tooltip común de gráficos (REQ-001-14). */
export function ChartTooltipBox({ title, rows }: { title: string; rows: Row[] }) {
  return (
    <div className="rounded-xl border border-border bg-surface px-3 py-2 text-xs shadow-lg">
      <p className="mb-1 font-semibold text-ink">{title}</p>
      {rows.map((r) => (
        <p key={r.name} className="tabular flex items-center gap-2 text-muted">
          {r.color && <span aria-hidden className="h-2 w-2 rounded-full" style={{ background: r.color }} />}
          <span>{r.name}</span>
          <span className="ml-auto pl-3 font-semibold text-ink">{r.value}</span>
        </p>
      ))}
    </div>
  );
}
