import type { DashboardSummary, HealthLight } from '../api/types';
import { HEALTH_TONE } from '../design/semantics';
import { formatPct, formatSignedPct } from '../i18n/format';
import { HEALTH_LABEL } from '../i18n/labels';
import { TONE_CHIP, TONE_DOT } from './tone';

function Tile({
  id,
  title,
  light,
  value,
  detail,
}: {
  id: string;
  title: string;
  light: HealthLight;
  value: string;
  detail: string;
}) {
  const tone = HEALTH_TONE[light];
  return (
    <div
      data-testid={`health-${id}`}
      data-tone={tone}
      className="flex items-center gap-4 rounded-xl bg-bg/70 px-4 py-3"
    >
      <span className="relative flex h-3.5 w-3.5 shrink-0" aria-hidden>
        {tone === 'danger' && (
          <span
            className={`absolute inline-flex h-full w-full animate-ping rounded-full opacity-60 ${TONE_DOT[tone]}`}
          />
        )}
        <span className={`relative inline-flex h-3.5 w-3.5 rounded-full ${TONE_DOT[tone]}`} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium text-muted">{title}</p>
        <p className="tabular text-lg font-semibold text-ink">{value}</p>
      </div>
      <div className="text-right">
        <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ring-1 ring-inset ${TONE_CHIP[tone]}`}>
          {HEALTH_LABEL[light]}
        </span>
        <p className="mt-1 text-xs text-muted">{detail}</p>
      </div>
    </div>
  );
}

/** REQ-001-16: Health del proceso con semáforos calculados en backend. */
export function HealthPanel({ summary }: { summary: DashboardSummary }) {
  const { health, kpis } = summary;
  const change = health.verificationError.changePct;
  return (
    <section
      data-testid="health-panel"
      aria-label="Health del proceso"
      className="rounded-2xl border border-border bg-surface p-4"
    >
      <div className="mb-3 flex items-center justify-between px-1">
        <h2 className="text-sm font-semibold text-ink">Health del proceso</h2>
        <p className="text-xs text-muted">Semáforo del periodo seleccionado</p>
      </div>
      <div className="grid grid-cols-3 gap-3">
        <Tile
          id="conversion"
          title="Conversión"
          light={health.conversion}
          value={formatPct(kpis.conversionPct.value)}
          detail="Objetivo ≥ 75 %"
        />
        <Tile
          id="sla"
          title="SLA"
          light={health.sla}
          value={formatPct(kpis.slaPct.value)}
          detail={`Objetivo ${formatPct(kpis.slaPct.target)}`}
        />
        <Tile
          id="verification"
          title="Error de verificación"
          light={health.verification}
          value={formatPct(health.verificationError.valuePct)}
          detail={change === null ? 'Sin comparativa' : `${formatSignedPct(change)} vs. anterior`}
        />
      </div>
    </section>
  );
}
