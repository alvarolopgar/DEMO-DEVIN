import { describe, expect, test } from 'vitest';
import { buildFunnel } from '../../src/domain/funnel.js';

describe('Funnel (REQ-001-05)', () => {
  test('[AC-001-04] 1.000 iniciadas y 780 completadas → Inicio 1.000, Cliente creado 780, conversión 78 %', () => {
    const f = buildFunnel({ START: 60, DATA: 40, VERIFICATION: 120, CUSTOMER_CREATED: 780 });
    expect(f.stages.map((s) => s.stage)).toEqual(['START', 'DATA', 'VERIFICATION', 'CUSTOMER_CREATED']);
    expect(f.stages[0]?.count).toBe(1000);
    expect(f.stages[1]?.count).toBe(940);
    expect(f.stages[2]?.count).toBe(900);
    expect(f.stages[3]?.count).toBe(780);
    expect(f.overallConversionPct).toBe(78);
    expect(f.stages[3]?.conversionFromStartPct).toBe(78);
    expect(f.stages[0]?.conversionFromPreviousPct).toBe(100);
    expect(f.stages[3]?.conversionFromPreviousPct).toBe(86.7);
  });

  test('[REQ-001-19] funnel vacío sin divisiones por cero', () => {
    const f = buildFunnel({ START: 0, DATA: 0, VERIFICATION: 0, CUSTOMER_CREATED: 0 });
    expect(f.overallConversionPct).toBeNull();
    expect(f.stages.every((s) => s.count === 0 && s.conversionFromStartPct === null)).toBe(true);
  });
});
