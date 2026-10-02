import { PolarAngleAxis, RadialBar, RadialBarChart, ResponsiveContainer } from 'recharts';
import type { DashboardSummary } from '../api/types';
import { HEALTH_TONE } from '../design/semantics';
import { chart, tokens } from '../design/tokens';
import { formatDuration, formatInt, formatPct } from '../i18n/format';
import { Card } from './Card';
import { TONE_TEXT } from './tone';

/** REQ-001-09 / REQ-001-10: cumplimiento SLA y activas dentro, próximas y fuera de SLA. */
export function SlaCard({ summary }: { summary: DashboardSummary }) {
  const { sla } = summary;
  const tone = HEALTH_TONE[summary.health.sla];
  const fill = {
    ok: chart.completed,
    warn: chart.inProgress,
    danger: chart.rejected,
    neutral: chart.expired,
    primary: chart.primary,
  }[tone];
  return (
    <Card
      testId="sla-card"
      title="Cumplimiento SLA"
      subtitle={`Umbral ${formatDuration(sla.thresholdSec)} · aviso desde ${formatDuration(sla.warningSec)}`}
      className="col-span-5"
    >
      <div className="flex items-center gap-6">
        <div
          className="relative h-40 w-40 shrink-0"
          role="img"
          aria-label={`Cumplimiento SLA ${formatPct(sla.compliancePct)} sobre objetivo ${formatPct(sla.targetPct)}`}
        >
          <ResponsiveContainer width="100%" height="100%">
            <RadialBarChart
              data={[{ value: sla.compliancePct ?? 0 }]}
              innerRadius="78%"
              outerRadius="100%"
              startAngle={90}
              endAngle={-270}
            >
              <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
              <RadialBar
                dataKey="value"
                cornerRadius={12}
                fill={fill}
                background={{ fill: tokens.color['neutral-soft'] }}
                isAnimationActive={false}
              />
            </RadialBarChart>
          </ResponsiveContainer>
          <div className="pointer-events-none absolute inset-0 grid place-items-center text-center">
            <div>
              <p data-testid="sla-compliance" className={`tabular text-2xl font-semibold ${TONE_TEXT[tone]}`}>
                {formatPct(sla.compliancePct)}
              </p>
              <p className="text-xs text-muted">objetivo {formatPct(sla.targetPct)}</p>
            </div>
          </div>
        </div>
        <dl className="grid flex-1 grid-cols-1 gap-2 text-sm">
          <div className="flex items-center justify-between rounded-lg bg-ok-soft px-3 py-2 text-ok-ink">
            <dt>Activas dentro de SLA</dt>
            <dd data-testid="sla-active-within" className="tabular font-semibold">
              {formatInt(sla.activeWithinCount)} / {formatInt(sla.activeCount)} · {formatPct(sla.activeWithinPct)}
            </dd>
          </div>
          <div className="flex items-center justify-between rounded-lg bg-warn-soft px-3 py-2 text-warn-ink">
            <dt>Próximas a SLA</dt>
            <dd data-testid="sla-warning" className="tabular font-semibold">
              {formatInt(sla.warningCount)}
            </dd>
          </div>
          <div className="flex items-center justify-between rounded-lg bg-danger-soft px-3 py-2 text-danger-ink">
            <dt>Fuera de SLA</dt>
            <dd data-testid="sla-breached" className="tabular font-semibold">
              {formatInt(sla.breachedCount)}
            </dd>
          </div>
        </dl>
      </div>
    </Card>
  );
}
