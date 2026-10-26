import { describe, expect, test } from 'vitest';
import { averageSeconds, conversionPct, deltaPoints, deltaRelativePct, pct } from '../../src/domain/metrics.js';

describe('Métricas (BR-001, BR-002, BR-007)', () => {
  test('[BR-001] conversión = completadas / iniciadas × 100 redondeada a 1 decimal', () => {
    expect(conversionPct(780, 1000)).toBe(78);
    expect(conversionPct(2, 3)).toBe(66.7);
  });

  test('[REQ-001-19] sin solicitudes la conversión es nula, no 0 % engañoso', () => {
    expect(conversionPct(0, 0)).toBeNull();
    expect(pct(1, 0)).toBeNull();
  });

  test('[BR-002] tiempo medio = suma de duraciones / completadas', () => {
    expect(averageSeconds(2400, 10)).toBe(240);
    expect(averageSeconds(0, 0)).toBeNull();
  });

  test('[BR-007] variación relativa del volumen frente al periodo anterior', () => {
    expect(deltaRelativePct(12480, 11520)).toBe(8.3);
    expect(deltaRelativePct(10, 0)).toBeNull();
  });

  test('[REQ-001-02] variación en puntos porcentuales y nula sin comparativa', () => {
    expect(deltaPoints(78.4, 76.3)).toBe(2.1);
    expect(deltaPoints(92, null)).toBeNull();
    expect(deltaPoints(null, 92)).toBeNull();
  });
});
