import { describe, expect, test } from 'vitest';
import { resolvePeriod } from '../../src/domain/period.js';

const now = new Date('2026-10-01T10:00:00.000Z');
const H = 3_600_000;

describe('Periodos (BR-007, C-001-01)', () => {
  test('[BR-007] Hoy = 24 h móviles; periodo anterior de idéntica duración e inmediatamente previo', () => {
    const p = resolvePeriod('today', now);
    expect(p.current.to.getTime()).toBe(now.getTime());
    expect(p.current.to.getTime() - p.current.from.getTime()).toBe(24 * H);
    expect(p.previous.to.getTime()).toBe(p.current.from.getTime());
    expect(p.previous.to.getTime() - p.previous.from.getTime()).toBe(24 * H);
    expect(p.granularity).toBe('hour');
    expect(p.bucketCount).toBe(24);
  });

  test('[REQ-001-03] 7 días y 30 días con puntos diarios', () => {
    const w = resolvePeriod('7d', now);
    expect(w.current.to.getTime() - w.current.from.getTime()).toBe(7 * 24 * H);
    expect(w.previous.from.getTime()).toBe(now.getTime() - 14 * 24 * H);
    expect(w.granularity).toBe('day');
    expect(w.bucketCount).toBe(7);
    const m = resolvePeriod('30d', now);
    expect(m.previous.from.getTime()).toBe(now.getTime() - 60 * 24 * H);
    expect(m.bucketCount).toBe(30);
  });
});
