import { Bar, BarChart, Cell, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { Funnel } from '../api/types';
import { chart } from '../design/tokens';
import { formatInt, formatPct } from '../i18n/format';
import { STAGE_LABEL } from '../i18n/labels';
import { Card } from './Card';
import { ChartTooltipBox } from './ChartTooltip';

/** REQ-001-05: Inicio → Datos → Verificación → Cliente creado. */
export function FunnelChart({ funnel }: { funnel: Funnel }) {
  const data = funnel.stages.map((s) => ({ ...s, label: STAGE_LABEL[s.stage] }));
  return (
    <Card
      testId="funnel"
      title="Funnel de onboarding"
      subtitle="Solicitudes que alcanzan cada etapa"
      className="col-span-7"
      aside={
        <div className="text-right">
          <p className="text-xs text-muted">Conversión total</p>
          <p data-testid="funnel-conversion" className="tabular text-lg font-semibold text-ink">
            {formatPct(funnel.overallConversionPct)}
          </p>
        </div>
      }
    >
      <div className="h-56" role="img" aria-label="Gráfico de funnel; los valores se detallan en la tabla siguiente">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            layout="vertical"
            margin={{ left: 8, right: 72, top: 4, bottom: 4 }}
            barCategoryGap={10}
          >
            <XAxis type="number" hide domain={[0, 'dataMax']} />
            <YAxis
              type="category"
              dataKey="label"
              width={104}
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
                    rows={[
                      { name: 'Solicitudes', value: formatInt(p.count) },
                      { name: 'Desde etapa anterior', value: formatPct(p.conversionFromPreviousPct) },
                      { name: 'Desde inicio', value: formatPct(p.conversionFromStartPct) },
                    ]}
                  />
                );
              }}
            />
            <Bar dataKey="count" radius={[0, 8, 8, 0]} isAnimationActive={false}>
              {data.map((d, i) => (
                <Cell key={d.stage} fill={chart.funnel[i] ?? chart.primary} />
              ))}
              <LabelList
                dataKey="count"
                position="right"
                formatter={(v) => formatInt(Number(v))}
                className="tabular"
                fill={chart.axis}
                fontSize={12}
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <ol className="mt-3 grid grid-cols-4 gap-2" data-testid="funnel-steps">
        {funnel.stages.map((s) => (
          <li key={s.stage} data-stage={s.stage} data-count={s.count} className="rounded-lg bg-bg/70 px-3 py-2">
            <p className="text-xs text-muted">{STAGE_LABEL[s.stage]}</p>
            <p className="tabular text-sm font-semibold text-ink">{formatInt(s.count)}</p>
            <p className="tabular text-xs text-muted">{formatPct(s.conversionFromPreviousPct)} vs. etapa previa</p>
          </li>
        ))}
      </ol>
    </Card>
  );
}
