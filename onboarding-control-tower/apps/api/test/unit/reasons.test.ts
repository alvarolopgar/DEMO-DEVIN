import { describe, expect, test } from 'vitest';
import { buildReasons } from '../../src/domain/reasons.js';

describe('Causas de abandono/rechazo (REQ-001-08)', () => {
  test('[REQ-001-08] ordenadas por volumen con % sobre incidencias y tipo', () => {
    const r = buildReasons({ ABANDONED: 120, DOCUMENT_INVALID: 160, IDENTITY_FAILED: 40, INCOMPLETE: 80, OTHER: 0 });
    expect(r.totalIncidents).toBe(400);
    expect(r.reasons.map((x) => x.reason)).toEqual(['DOCUMENT_INVALID', 'ABANDONED', 'INCOMPLETE', 'IDENTITY_FAILED']);
    expect(r.reasons[0]).toEqual({ reason: 'DOCUMENT_INVALID', kind: 'REJECTION', count: 160, pct: 40 });
    expect(r.reasons[1]?.kind).toBe('ABANDONMENT');
  });
});
