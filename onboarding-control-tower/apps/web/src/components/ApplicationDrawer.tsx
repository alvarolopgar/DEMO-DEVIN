import { useEffect, useRef } from 'react';
import { useApplication } from '../api/queries';
import { formatClock, formatTime } from '../i18n/format';
import { EVENT_LABEL, REASON_LABEL, SEGMENT_LABEL, STATUS_LABEL } from '../i18n/labels';
import { RiskChip, SlaChip, StatusChip } from './Chip';
import { Skeleton } from './Skeleton';

/** UI-005 / REQ-001-15: detalle con timeline; Esc o clic fuera cierra. */
export function ApplicationDrawer({ id, onClose }: { id: string; onClose: () => void }) {
  const { data, isError, refetch } = useApplication(id);
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  const terminal =
    data && (data.status === 'REJECTED' || data.status === 'EXPIRED') && data.closedAt
      ? {
          label: `${STATUS_LABEL[data.status]}${data.rejectionReason ? ` · ${REASON_LABEL[data.rejectionReason]}` : ''}`,
          at: data.closedAt,
        }
      : null;

  return (
    <div className="fixed inset-0 z-40 flex justify-end">
      <div
        data-testid="drawer-backdrop"
        aria-hidden
        className="absolute inset-0 bg-ink/30 backdrop-blur-[1px]"
        onClick={onClose}
      />
      <aside
        role="dialog"
        aria-modal="true"
        aria-labelledby="drawer-title"
        data-testid="application-drawer"
        className="relative flex h-full w-[440px] max-w-full flex-col overflow-y-auto bg-surface shadow-2xl"
      >
        <header className="flex items-start justify-between border-b border-border px-6 py-5">
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-muted">Detalle de solicitud</p>
            <h2 id="drawer-title" className="font-mono text-xl font-semibold text-ink">
              {id}
            </h2>
          </div>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            aria-label="Cerrar detalle"
            className="rounded-lg p-2 text-muted hover:bg-neutral-soft hover:text-ink focus-visible:outline-2 focus-visible:outline-primary"
          >
            <svg
              viewBox="0 0 24 24"
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              aria-hidden
            >
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </header>
        <div className="flex-1 px-6 py-5">
          {isError && (
            <div role="alert" className="rounded-xl bg-danger-soft p-4 text-sm text-danger-ink">
              No se pudo cargar el detalle.{' '}
              <button type="button" className="font-semibold underline" onClick={() => void refetch()}>
                Reintentar
              </button>
            </div>
          )}
          {!data && !isError && (
            <div className="space-y-3">
              <Skeleton className="h-16" />
              <Skeleton className="h-64" />
            </div>
          )}
          {data && (
            <>
              <div className="flex flex-wrap gap-2">
                <StatusChip status={data.status} />
                <SlaChip status={data.slaStatus} />
                <RiskChip risk={data.risk} />
              </div>
              <dl className="mt-5 grid grid-cols-2 gap-3 text-sm">
                {[
                  ['Segmento', SEGMENT_LABEL[data.segment]],
                  ['Inicio', formatTime(data.startedAt)],
                  ['Tiempo', formatClock(data.elapsedSec)],
                  ['Cierre', data.closedAt ? formatTime(data.closedAt) : 'En curso'],
                ].map(([k, v]) => (
                  <div key={k} className="rounded-lg bg-bg/70 px-3 py-2">
                    <dt className="text-xs text-muted">{k}</dt>
                    <dd className="tabular font-semibold text-ink">{v}</dd>
                  </div>
                ))}
              </dl>
              <h3 className="mt-6 mb-3 text-sm font-semibold text-ink">Timeline</h3>
              <ol className="relative ml-2 border-l-2 border-border" data-testid="timeline">
                {data.events.map((e) => (
                  <li
                    key={`${e.type}-${e.occurredAt}`}
                    data-testid="timeline-event"
                    data-type={e.type}
                    className="relative mb-4 pl-6"
                  >
                    <span
                      aria-hidden
                      className="absolute -left-[7px] top-1.5 h-3 w-3 rounded-full border-2 border-surface bg-primary"
                    />
                    <p className="text-sm font-medium text-ink">{EVENT_LABEL[e.type]}</p>
                    <p className="tabular text-xs text-muted">
                      {formatTime(e.occurredAt)} · +{formatClock(e.offsetSec)}
                    </p>
                  </li>
                ))}
                {terminal && (
                  <li data-testid="timeline-terminal" className="relative mb-4 pl-6">
                    <span
                      aria-hidden
                      className="absolute -left-[7px] top-1.5 h-3 w-3 rounded-full border-2 border-surface bg-danger"
                    />
                    <p className="text-sm font-medium text-danger-ink">{terminal.label}</p>
                    <p className="tabular text-xs text-muted">{formatTime(terminal.at)}</p>
                  </li>
                )}
              </ol>
            </>
          )}
        </div>
      </aside>
    </div>
  );
}
