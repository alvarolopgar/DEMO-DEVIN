import { describe, expect, test } from 'vitest';
import {
  ACTIVE_SLA_THRESHOLD_SECONDS,
  SLA_THRESHOLD_SECONDS,
  WARNING_THRESHOLD_SECONDS,
} from '../../src/domain/constants.js';
import { activeWithinPct, classifySla, elapsedSeconds, slaCompliancePct } from '../../src/domain/sla.js';

describe('SLA (BR-003, BR-004, BR-005)', () => {
  test('[REQ-001-10] [BR-004] [BR-005] umbral de completadas 5 min; activas: aviso > 2 min, fuera > 3 min (C-001-20)', () => {
    expect(SLA_THRESHOLD_SECONDS).toBe(300);
    expect(ACTIVE_SLA_THRESHOLD_SECONDS).toBe(180);
    expect(WARNING_THRESHOLD_SECONDS).toBe(120);
  });

  test('[AC-001-05] una solicitud activa con 2 min 30 s está próxima a SLA (BR-004)', () => {
    expect(classifySla('VERIFYING', 150)).toBe('WARNING');
  });

  test('[AC-001-06] una solicitud activa con 3 min 01 s está fuera de SLA (BR-005)', () => {
    expect(classifySla('VERIFYING', 181)).toBe('BREACHED');
  });

  test('[BR-004] [BR-005] límites de activas: 120 s en SLA, 121 s y 180 s próximas, 181 s fuera (C-001-20)', () => {
    expect(classifySla('STARTED', 120)).toBe('WITHIN');
    expect(classifySla('DATA_COMPLETED', 121)).toBe('WARNING');
    expect(classifySla('DATA_COMPLETED', 180)).toBe('WARNING');
    expect(classifySla('STARTED', 181)).toBe('BREACHED');
    expect(classifySla('VERIFYING', 270)).toBe('BREACHED');
  });

  test('[BR-005] [REQ-001-10] los umbrales de activas no se aplican a completadas (C-001-20)', () => {
    expect(classifySla('COMPLETED', 181)).toBe('WITHIN');
    expect(classifySla('COMPLETED', 270)).toBe('WITHIN');
  });

  test('[BR-003] completadas se evalúan por duración; rechazadas y caducadas no son evaluables', () => {
    expect(classifySla('COMPLETED', 300)).toBe('WITHIN');
    expect(classifySla('COMPLETED', 301)).toBe('BREACHED');
    expect(classifySla('REJECTED', 900)).toBe('NOT_EVALUATED');
    expect(classifySla('EXPIRED', 1800)).toBe('NOT_EVALUATED');
  });

  test('[REQ-001-11] tiempo transcurrido: activa contra ahora, cerrada contra cierre', () => {
    const startedAt = new Date('2026-10-01T10:00:00Z');
    const now = new Date('2026-10-01T10:04:30Z');
    expect(elapsedSeconds({ startedAt, closedAt: null }, now)).toBe(270);
    expect(elapsedSeconds({ startedAt, closedAt: new Date('2026-10-01T10:03:00Z') }, now)).toBe(180);
  });

  test('[BR-003] cumplimiento SLA = (activas + completadas en umbral) / evaluables × 100', () => {
    expect(slaCompliancePct({ completedWithin: 880, completedTotal: 950, activeWithin: 40, activeTotal: 50 })).toBe(92);
    expect(slaCompliancePct({ completedWithin: 0, completedTotal: 0, activeWithin: 0, activeTotal: 0 })).toBeNull();
  });

  test('[REQ-001-09] porcentaje de activas dentro de SLA', () => {
    expect(activeWithinPct({ activeWithin: 3, activeTotal: 4 })).toBe(75);
    expect(activeWithinPct({ activeWithin: 0, activeTotal: 0 })).toBeNull();
  });
});
