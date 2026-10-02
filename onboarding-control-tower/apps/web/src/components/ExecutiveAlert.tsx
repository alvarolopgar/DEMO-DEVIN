/** UI-006 / REQ-001-17: el mensaje procede íntegramente del backend. */
export function ExecutiveAlert({ message }: { message: string }) {
  return (
    <div
      role="alert"
      data-testid="executive-alert"
      className="flex items-center gap-4 rounded-2xl border border-danger/30 bg-danger-soft px-5 py-4 text-danger-ink"
    >
      <span aria-hidden className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-danger text-surface">
        <svg
          viewBox="0 0 24 24"
          className="h-5 w-5"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.4"
          strokeLinecap="round"
        >
          <path d="M12 8v5M12 16.5v.5" />
        </svg>
      </span>
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider">Alerta ejecutiva</p>
        <p className="text-sm font-medium">{message}</p>
      </div>
    </div>
  );
}
