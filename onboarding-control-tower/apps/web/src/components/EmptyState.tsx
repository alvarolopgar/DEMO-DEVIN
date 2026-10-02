/** UI-003 / REQ-001-19. */
export function EmptyState({ onReset }: { onReset: () => void }) {
  return (
    <section
      data-testid="empty-state"
      className="col-span-12 grid place-items-center rounded-2xl border border-dashed border-border bg-surface px-8 py-16 text-center"
    >
      <div aria-hidden className="mb-4 grid h-14 w-14 place-items-center rounded-full bg-neutral-soft text-neutral-ink">
        <svg
          viewBox="0 0 24 24"
          className="h-7 w-7"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        >
          <path d="M4 19h16M7 15V9m5 6V5m5 10v-3" />
        </svg>
      </div>
      <h2 className="text-lg font-semibold text-ink">No hay datos para este filtro</h2>
      <p className="mt-1 max-w-md text-sm text-muted">
        No se han iniciado solicitudes en el periodo y segmento seleccionados. Prueba con otro periodo o segmento.
      </p>
      <button
        type="button"
        onClick={onReset}
        className="mt-5 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-surface hover:bg-primary-strong focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
      >
        Ver 30 días · Todos
      </button>
    </section>
  );
}
