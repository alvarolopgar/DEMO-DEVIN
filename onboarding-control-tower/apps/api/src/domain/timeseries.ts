import type { ResolvedPeriod } from './period.js';
import { isActive, type Status } from './types.js';

export interface BucketStatusCount {
  bucket: number;
  status: Status;
  count: number;
}

export interface TimeseriesPoint {
  bucketStart: string;
  completed: number;
  inProgress: number;
  rejected: number;
}

/** REQ-001-06 (C-001-13) */
export function buildTimeseries(period: ResolvedPeriod, rows: BucketStatusCount[]): TimeseriesPoint[] {
  const points: TimeseriesPoint[] = Array.from({ length: period.bucketCount }, (_, i) => ({
    bucketStart: new Date(period.current.from.getTime() + i * period.bucketMs).toISOString(),
    completed: 0,
    inProgress: 0,
    rejected: 0,
  }));
  for (const row of rows) {
    const point = points[row.bucket];
    if (!point) continue;
    if (row.status === 'COMPLETED') point.completed += row.count;
    else if (row.status === 'REJECTED') point.rejected += row.count;
    else if (isActive(row.status)) point.inProgress += row.count;
  }
  return points;
}
