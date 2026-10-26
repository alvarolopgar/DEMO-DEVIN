import type { HealthLight, Risk, SlaStatus, Status } from '../api/types';

/** Traducción de estados del backend a tonos visuales (REQ-001-13, ui/states.md). Sin reglas de negocio. */
export type Tone = 'ok' | 'warn' | 'danger' | 'neutral' | 'primary';

export const STATUS_TONE: Record<Status, Tone> = {
  STARTED: 'warn',
  DATA_COMPLETED: 'warn',
  VERIFYING: 'warn',
  COMPLETED: 'ok',
  REJECTED: 'danger',
  EXPIRED: 'neutral',
};

export const SLA_TONE: Record<SlaStatus, Tone> = {
  WITHIN: 'ok',
  WARNING: 'warn',
  BREACHED: 'danger',
  NOT_EVALUATED: 'neutral',
};

export const RISK_TONE: Record<Risk, Tone> = { LOW: 'ok', MEDIUM: 'warn', HIGH: 'danger' };

export const HEALTH_TONE: Record<HealthLight, Tone> = { GREEN: 'ok', AMBER: 'warn', RED: 'danger', NO_DATA: 'neutral' };
