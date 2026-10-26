import { HEALTH_THRESHOLDS, VERIFICATION_ALERT_INCREASE_PCT } from './constants.js';
import { pct, round1 } from './metrics.js';
import type { HealthLight } from './types.js';

function higherIsBetter(value: number | null, t: { green: number; amber: number }): HealthLight {
  if (value === null) return 'NO_DATA';
  if (value >= t.green) return 'GREEN';
  return value >= t.amber ? 'AMBER' : 'RED';
}

export function conversionHealth(conversionPct: number | null): HealthLight {
  return higherIsBetter(conversionPct, HEALTH_THRESHOLDS.conversion);
}

export function slaHealth(slaPct: number | null): HealthLight {
  return higherIsBetter(slaPct, HEALTH_THRESHOLDS.sla);
}

export function verificationHealth(errorPct: number | null): HealthLight {
  if (errorPct === null) return 'NO_DATA';
  const t = HEALTH_THRESHOLDS.verificationError;
  if (errorPct <= t.green) return 'GREEN';
  return errorPct <= t.amber ? 'AMBER' : 'RED';
}

/** BR-006 */
export function verificationErrorPct(rejectedByVerification: number, reachedVerification: number): number | null {
  return pct(rejectedByVerification, reachedVerification);
}

/** REQ-001-17 (C-001-12): alerta si el incremento relativo supera el 20 %. */
export function verificationAlert(
  currentPct: number | null,
  previousPct: number | null,
): { changePct: number | null; alert: string | null } {
  if (currentPct === null || previousPct === null || previousPct === 0) return { changePct: null, alert: null };
  const changePct = round1(((currentPct - previousPct) / previousPct) * 100);
  const alert =
    changePct > VERIFICATION_ALERT_INCREASE_PCT
      ? `Los errores de verificación han aumentado un ${Math.round(changePct)} % frente al periodo anterior.`
      : null;
  return { changePct, alert };
}
