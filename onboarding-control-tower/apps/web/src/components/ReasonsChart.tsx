import { Bar, BarChart, Cell, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { Reasons } from '../api/types';
import { chart } from '../design/tokens';
import { formatInt, formatPct } from '../i18n/format';
import { REASON_LABEL } from '../i18n/labels';
import { Card } from './Card';
import { ChartTooltipBox } from './ChartTooltip';

const KIND_COLOR = { REJECTION: chart.rejected, ABANDONMENT: chart.expired } as const;

/** REQ-001-08: causas de rechazo y abandono. */
export function ReasonsChart({ reasons }: { reasons: Reasons }) {
  const data = reasons.reasons.map((r) => ({ ...r, label: REASON_LABEL[r.reason] }));
  return (
    <Card
      testId="reasons"
      title="Causas de rechazo y abandono"
      subtitle={`${formatInt(reasons.totalIncidents)} incidencias en el periodo`}
      className="col-span-7"
      aside={
        <div className="flex gap-3 text-xs text-muted">
          <span className="flex items-center gap-1.5">
            <span aria-hidden className="h-2 w-2 rounded-full bg-danger" /> Rechazo
          </span>
          <span className="flex items-center gap-1.5">
            <span aria-hidden className="h-2 w-2 rounded-full bg-neutral" /> Abandono
          </span>
        </div>
      }
    >
      <div className="h-56" role="img" aria-label="Causas de rechazo y abandono; valores junto a cada barra">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical" margin={{ left: 8, right: 96, top: 0, bottom: 0 }} barCategoryGap={8}>
            <XAxis type="number" hide />
            <YAxis
              type="category"
              dataKey="label"
              width={156}
              tickLine={false}
              axisLine={false}
              tick={{ fill: chart.axis, fontSize: 12 }}
            />
            <Tooltip
              cursor={{ fill: chart.grid, opacity: 0.4 }}
              content={({ active, payload }) => {
                const p = active ? payload?.[0]?.payload : undefined;
                if (!p) return null;
                return (
                  <ChartTooltipBox
                    title={p.label}
                    rows={[{ name: 'Incidencias', value: `${formatInt(p.count)} · ${formatPct(p.pct)}` }]}
                  />
                );
              }}
            />
            <Bar dataKey="count" radius={[0, 6, 6, 0]} isAnimationActive={false}>
              {data.map((d) => (
                <Cell key={d.reason} fill={KIND_COLOR[d.kind]} />
              ))}
              <LabelList
                dataKey="pct"
                position="right"
                formatter={(v) => formatPct(v === null || v === undefined ? null : Number(v))}
                fill={chart.axis}
                fontSize={12}
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <ul className="sr-only" data-testid="reasons-list">
        {data.map((d) => (
          <li key={d.reason} data-reason={d.reason}>
            {d.label}: {formatInt(d.count)} ({formatPct(d.pct)})
          </li>
        ))}
      </ul>
    </Card>
  );
}
