import { ACTIVE_SLA_THRESHOLD_SECONDS, SLA_THRESHOLD_SECONDS, WARNING_THRESHOLD_SECONDS } from './constants.js';
import { pct } from './metrics.js';
import { isActive, type SlaStatus, type Status } from './types.js';

/** C-001-16: activas contra el instante de referencia; cerradas contra su cierre. */
export function elapsedSeconds(app: { startedAt: Date; closedAt: Date | null }, now: Date): number {
  const end = app.closedAt ?? now;
  return Math.max(0, Math.floor((end.getTime() - app.startedAt.getTime()) / 1000));
}

/** BR-003, BR-004, BR-005 (C-001-20): completadas contra 300 s; activas contra 120/180 s. */
export function classifySla(status: Status, elapsedSec: number): SlaStatus {
  if (status === 'COMPLETED') return elapsedSec <= SLA_THRESHOLD_SECONDS ? 'WITHIN' : 'BREACHED';
  if (!isActive(status)) return 'NOT_EVALUATED';
  if (elapsedSec > ACTIVE_SLA_THRESHOLD_SECONDS) return 'BREACHED';
  if (elapsedSec > WARNING_THRESHOLD_SECONDS) return 'WARNING';
  return 'WITHIN';
}

export interface SlaCounts {
  completedWithin: number;
  completedTotal: number;
  activeWithin: number;
  activeTotal: number;
}

/** BR-003: (activas + completadas dentro del umbral) / evaluables × 100. */
export function slaCompliancePct(c: SlaCounts): number | null {
  return pct(c.completedWithin + c.activeWithin, c.completedTotal + c.activeTotal);
}

/** REQ-001-09 (C-001-05): activas dentro de SLA / activas × 100. */
export function activeWithinPct(c: Pick<SlaCounts, 'activeWithin' | 'activeTotal'>): number | null {
  return pct(c.activeWithin, c.activeTotal);
}
