/** REQ-001-10: umbral de SLA de la demo (inicio → cliente creado). */
export const SLA_THRESHOLD_SECONDS = 300;
/** BR-004: a partir de este tiempo una solicitud activa está próxima a SLA. */
export const WARNING_THRESHOLD_SECONDS = 240;
/** Objetivo de cumplimiento de SLA (SPEC-001 §10). */
export const SLA_TARGET_PCT = 95;
/** REQ-001-17: incremento relativo (%) del error de verificación que dispara la alerta. */
export const VERIFICATION_ALERT_INCREASE_PCT = 20;

/** C-001-06: umbrales del semáforo Health. */
export const HEALTH_THRESHOLDS = {
  conversion: { green: 75, amber: 65 },
  sla: { green: SLA_TARGET_PCT, amber: 90 },
  verificationError: { green: 5, amber: 7 },
} as const;
