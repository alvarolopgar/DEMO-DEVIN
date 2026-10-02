import { describe, expect, test } from 'vitest';
import {
  conversionHealth,
  slaHealth,
  verificationAlert,
  verificationErrorPct,
  verificationHealth,
} from '../../src/domain/health.js';

describe('Health del proceso (REQ-001-16, REQ-001-17, BR-006)', () => {
  test('[BR-006] error de verificación = rechazadas por verificación / alcanzaron verificación × 100', () => {
    expect(verificationErrorPct(87, 1000)).toBe(8.7);
    expect(verificationErrorPct(0, 0)).toBeNull();
  });

  test('[REQ-001-16] semáforos de conversión, SLA y error de verificación (C-001-06)', () => {
    expect(conversionHealth(78.4)).toBe('GREEN');
    expect(conversionHealth(70)).toBe('AMBER');
    expect(conversionHealth(60)).toBe('RED');
    expect(slaHealth(96)).toBe('GREEN');
    expect(slaHealth(92)).toBe('AMBER');
    expect(slaHealth(85)).toBe('RED');
    expect(verificationHealth(4)).toBe('GREEN');
    expect(verificationHealth(6.5)).toBe('AMBER');
    expect(verificationHealth(8.7)).toBe('RED');
    expect(conversionHealth(null)).toBe('NO_DATA');
  });

  test('[AC-001-08] alerta ejecutiva si el error de verificación crece más de un 20 %', () => {
    const a = verificationAlert(8.6, 7.0);
    expect(a.changePct).toBe(22.9);
    expect(a.alert).toBe('Los errores de verificación han aumentado un 23 % frente al periodo anterior.');
  });

  test('[REQ-001-17] sin alerta si el incremento es ≤ 20 % o no hay comparativa (C-001-12)', () => {
    expect(verificationAlert(8.4, 7.0).alert).toBeNull();
    expect(verificationAlert(5, 6).alert).toBeNull();
    expect(verificationAlert(5, 0).alert).toBeNull();
    expect(verificationAlert(null, 5).alert).toBeNull();
  });
});
