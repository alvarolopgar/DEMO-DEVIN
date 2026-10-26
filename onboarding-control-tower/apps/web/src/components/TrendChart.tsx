import { Area, AreaChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { Timeseries } from '../api/types';
import { chart } from '../design/tokens';
import { formatDay, formatHour, formatInt } from '../i18n/format';
import { Card } from './Card';
import { ChartTooltipBox } from './ChartTooltip';

const SERIES = [
  { key: 'completed', name: 'Completadas', color: chart.completed },
  { key: 'inProgress', name: 'En curso', color: chart.inProgress },
  { key: 'rejected', name: 'Rechazadas', color: chart.rejected },
] as const;

/** REQ-001-06: evolución temporal de completadas, en curso y rechazadas. */
export function TrendChart({ series }: { series: Timeseries }) {
  const fmt = series.granularity === 'hour' ? formatHour : formatDay;
  const data = series.points.map((p) => ({ ...p, label: fmt(p.bucketStart) }));
  return (
    <Card
      testId="trend"
      title="Evolución temporal"
      subtitle={series.granularity === 'hour' ? 'Por hora de inicio' : 'Por día de inicio'}
      className="col-span-12"
    >
      <div className="h-64" role="img" aria-label="Evolución temporal de completadas, en curso y rechazadas">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
            <defs>
              {SERIES.map((s) => (
                <linearGradient key={s.key} id={`grad-${s.key}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={s.color} stopOpacity={0.28} />
                  <stop offset="100%" stopColor={s.color} stopOpacity={0.02} />
                </linearGradient>
              ))}
            </defs>
            <CartesianGrid stroke={chart.grid} vertical={false} />
            <XAxis
              dataKey="label"
              tickLine={false}
              axisLine={false}
              tick={{ fill: chart.axis, fontSize: 11 }}
              minTickGap={18}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tick={{ fill: chart.axis, fontSize: 11 }}
              tickFormatter={(v) => formatInt(Number(v))}
            />
            <Tooltip
              content={({ active, payload, label }) => {
                if (!active || !payload?.length) return null;
                return (
                  <ChartTooltipBox
                    title={String(label)}
                    rows={SERIES.map((s) => ({
                      name: s.name,
                      value: formatInt(Number(payload.find((x) => x.dataKey === s.key)?.value ?? 0)),
                      color: s.color,
                    }))}
                  />
                );
              }}
            />
            <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />
            {SERIES.map((s) => (
              <Area
                key={s.key}
                type="monotone"
                dataKey={s.key}
                name={s.name}
                stroke={s.color}
                strokeWidth={2}
                fill={`url(#grad-${s.key})`}
                isAnimationActive={false}
                dot={false}
              />
            ))}
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
