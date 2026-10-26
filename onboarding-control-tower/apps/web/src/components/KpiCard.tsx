import type { ReactNode } from 'react';
import type { Tone } from '../design/semantics';
import { TONE_CHIP } from './tone';

export type Trend = 'up' | 'down' | 'flat';

interface KpiCardProps {
  id: string;
  label: string;
  value: string;
  delta: string | null;
  trend: Trend;
  /** Dirección favorable de la métrica (solo para el color de la variación). */
  good: 'up' | 'down';
  comparison: string;
  hint?: string;
  icon?: ReactNode;
}

const ARROW: Record<Trend, string> = { up: '▲', down: '▼', flat: '●' };

export function KpiCard({ id, label, value, delta, trend, good, comparison, hint, icon }: KpiCardProps) {
  const tone: Tone = delta === null || trend === 'flat' ? 'neutral' : trend === good ? 'ok' : 'danger';
  return (
    <article
      data-testid={`kpi-${id}`}
      aria-label={label}
      className="flex flex-col rounded-2xl border border-border bg-surface p-5"
    >
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-muted">{label}</h3>
        {icon && (
          <span aria-hidden className="grid h-8 w-8 place-items-center rounded-lg bg-primary-soft text-primary-strong">
            {icon}
          </span>
        )}
      </div>
      <p
        data-testid={`kpi-${id}-value`}
        className="tabular mt-3 text-[2rem] font-semibold leading-none tracking-tight text-ink"
      >
        {value}
      </p>
      <div className="mt-4 flex items-center gap-2 text-xs">
        {delta === null ? (
          <span
            data-testid={`kpi-${id}-delta`}
            data-tone="neutral"
            className={`rounded-full px-2 py-0.5 font-semibold ring-1 ring-inset ${TONE_CHIP.neutral}`}
          >
            Sin comparativa
          </span>
        ) : (
          <span
            data-testid={`kpi-${id}-delta`}
            data-tone={tone}
            className={`tabular rounded-full px-2 py-0.5 font-semibold ring-1 ring-inset ${TONE_CHIP[tone]}`}
          >
            <span aria-hidden>{ARROW[trend]} </span>
            {delta}
          </span>
        )}
        <span className="text-muted">{comparison}</span>
      </div>
      {hint && <p className="mt-2 text-xs text-subtle">{hint}</p>}
    </article>
  );
}
