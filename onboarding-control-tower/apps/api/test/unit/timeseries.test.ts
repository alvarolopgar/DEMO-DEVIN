import { describe, expect, test } from 'vitest';
import { resolvePeriod } from '../../src/domain/period.js';
import { buildTimeseries } from '../../src/domain/timeseries.js';

describe('Serie temporal (REQ-001-06)', () => {
  test('[REQ-001-06] rellena todos los tramos y clasifica completadas, en curso y rechazadas', () => {
    const p = resolvePeriod('7d', new Date('2026-10-01T10:00:00.000Z'));
    const points = buildTimeseries(p, [
      { bucket: 0, status: 'COMPLETED', count: 5 },
      { bucket: 0, status: 'VERIFYING', count: 2 },
      { bucket: 6, status: 'REJECTED', count: 3 },
      { bucket: 6, status: 'STARTED', count: 1 },
      { bucket: 6, status: 'EXPIRED', count: 9 },
    ]);
    expect(points).toHaveLength(7);
    expect(points[0]).toEqual({ bucketStart: '2026-09-24T10:00:00.000Z', completed: 5, inProgress: 2, rejected: 0 });
    expect(points[6]).toEqual({ bucketStart: '2026-09-30T10:00:00.000Z', completed: 0, inProgress: 1, rejected: 3 });
    expect(points[3]).toEqual({ bucketStart: '2026-09-27T10:00:00.000Z', completed: 0, inProgress: 0, rejected: 0 });
  });
});
