export function Skeleton({ className = '' }: { className?: string }) {
  return <div data-testid="skeleton" aria-hidden className={`animate-pulse rounded-xl bg-neutral-soft ${className}`} />;
}

/** UI-001: placeholders de la rejilla del dashboard mientras se cargan los datos. */
export function DashboardSkeleton() {
  return (
    <div aria-busy="true" aria-label="Cargando datos" className="grid grid-cols-12 gap-5">
      <Skeleton className="col-span-12 h-24" />
      {[0, 1, 2, 3].map((i) => (
        <Skeleton key={i} className="col-span-3 h-36" />
      ))}
      <Skeleton className="col-span-7 h-80" />
      <Skeleton className="col-span-5 h-80" />
      <Skeleton className="col-span-12 h-72" />
    </div>
  );
}
