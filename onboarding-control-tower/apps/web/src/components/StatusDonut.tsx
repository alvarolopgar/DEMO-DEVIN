import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import type { DashboardSummary, Status } from '../api/types';
import { STATUS_TONE } from '../design/semantics';
import { chart, tokens } from '../design/tokens';
import { formatInt, formatPct } from '../i18n/format';
import { STATUS_LABEL } from '../i18n/labels';
import { Card } from './Card';
import { ChartTooltipBox } from './ChartTooltip';

const IN_PROGRESS_SHADES: Partial<Record<Status, string>> = {
  STARTED: tokens.color['warn-soft'],
  DATA_COMPLETED: tokens.color.warn,
  VERIFYING: tokens.color['warn-ink'],
};

const color = (s: Status) =>
  IN_PROGRESS_SHADES[s] ??
  {
    ok: chart.completed,
    danger: chart.rejected,
    neutral: chart.expired,
    warn: chart.inProgress,
    primary: chart.primary,
  }[STATUS_TONE[s]];

/** REQ-001-07: distribución por estado. */
export function StatusDonut({ summary }: { summary: DashboardSummary }) {
  const data = summary.statusBreakdown.map((s) => ({ ...s, label: STATUS_LABEL[s.status], fill: color(s.status) }));
  const total = summary.kpis.applications.value;
  return (
    <Card
      testId="status-donut"
      title="Distribución por estado"
      subtitle="Solicitudes iniciadas en el periodo"
      className="col-span-5"
    >
      <div className="flex items-center gap-6">
        <div
          className="relative h-56 w-56 shrink-0"
          role="img"
          aria-label="Gráfico de distribución por estado; valores en la leyenda"
        >
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                dataKey="count"
                nameKey="label"
                innerRadius="64%"
                outerRadius="96%"
                paddingAngle={1.5}
                stroke="none"
                isAnimationActive={false}
              >
                {data.map((d) => (
                  <Cell key={d.status} fill={d.fill} />
                ))}
              </Pie>
              <Tooltip
                content={({ active, payload }) => {
                  const p = active ? payload?.[0]?.payload : undefined;
                  if (!p) return null;
                  return (
                    <ChartTooltipBox
                      title={p.label}
                      rows={[
                        { name: 'Solicitudes', value: `${formatInt(p.count)} · ${formatPct(p.pct)}`, color: p.fill },
                      ]}
                    />
                  );
                }}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="pointer-events-none absolute inset-0 grid place-items-center text-center">
            <div>
              <p className="tabular text-2xl font-semibold text-ink">{formatInt(total)}</p>
              <p className="text-xs text-muted">solicitudes</p>
            </div>
          </div>
        </div>
        <ul className="min-w-0 flex-1 space-y-2" aria-label="Leyenda de estados">
          {data.map((d) => (
            <li key={d.status} data-status={d.status} className="flex items-center gap-2 text-sm">
              <span aria-hidden className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: d.fill }} />
              <span className="truncate text-muted">{d.label}</span>
              <span className="tabular ml-auto font-semibold text-ink">{formatInt(d.count)}</span>
              <span className="tabular w-14 text-right text-xs text-muted">{formatPct(d.pct)}</span>
            </li>
          ))}
        </ul>
      </div>
    </Card>
  );
}
