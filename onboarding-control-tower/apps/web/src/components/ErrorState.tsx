/** UI-004: error recuperable, sin detalles técnicos. */
export function ErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <section
      role="alert"
      data-testid="error-state"
      className="col-span-12 grid place-items-center rounded-2xl border border-danger/30 bg-surface px-8 py-16 text-center"
    >
      <div aria-hidden className="mb-4 grid h-14 w-14 place-items-center rounded-full bg-danger-soft text-danger-ink">
        <svg
          viewBox="0 0 24 24"
          className="h-7 w-7"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        >
          <path d="M12 8v5M12 16.5v.5M10.3 3.9 2.6 17.3A2 2 0 0 0 4.3 20h15.4a2 2 0 0 0 1.7-2.7L13.7 3.9a2 2 0 0 0-3.4 0Z" />
        </svg>
      </div>
      <h2 className="text-lg font-semibold text-ink">No se han podido cargar los datos</h2>
      <p className="mt-1 max-w-md text-sm text-muted">
        Se ha producido un problema al consultar el servicio. Inténtalo de nuevo en unos segundos.
      </p>
      <button
        type="button"
        onClick={onRetry}
        className="mt-5 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-surface hover:bg-primary-strong focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
      >
        Reintentar
      </button>
    </section>
  );
}
