import type { Period } from './types.js';

const HOUR_MS = 3_600_000;
const DAY_MS = 24 * HOUR_MS;

export interface DateRange {
  from: Date;
  to: Date;
}

export interface ResolvedPeriod {
  period: Period;
  current: DateRange;
  previous: DateRange;
  granularity: 'hour' | 'day';
  bucketMs: number;
  bucketCount: number;
}

const SPEC: Record<Period, { durationMs: number; granularity: 'hour' | 'day'; bucketMs: number }> = {
  today: { durationMs: DAY_MS, granularity: 'hour', bucketMs: HOUR_MS },
  '7d': { durationMs: 7 * DAY_MS, granularity: 'day', bucketMs: DAY_MS },
  '30d': { durationMs: 30 * DAY_MS, granularity: 'day', bucketMs: DAY_MS },
};

/** C-001-01 + BR-007: ventana móvil [from, to) y periodo anterior de idéntica duración. */
export function resolvePeriod(period: Period, now: Date): ResolvedPeriod {
  const { durationMs, granularity, bucketMs } = SPEC[period];
  const to = now.getTime();
  const from = to - durationMs;
  return {
    period,
    current: { from: new Date(from), to: new Date(to) },
    previous: { from: new Date(from - durationMs), to: new Date(from) },
    granularity,
    bucketMs,
    bucketCount: durationMs / bucketMs,
  };
}
