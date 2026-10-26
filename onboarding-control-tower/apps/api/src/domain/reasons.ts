import { pct } from './metrics.js';
import { REASONS, VERIFICATION_REASONS, type Reason } from './types.js';

export type ReasonKind = 'REJECTION' | 'ABANDONMENT';

export const REASON_KIND: Record<Reason, ReasonKind> = {
  DOCUMENT_INVALID: 'REJECTION',
  IDENTITY_FAILED: 'REJECTION',
  OTHER: 'REJECTION',
  ABANDONED: 'ABANDONMENT',
  INCOMPLETE: 'ABANDONMENT',
};

export function isVerificationReason(reason: Reason): boolean {
  return (VERIFICATION_REASONS as readonly Reason[]).includes(reason);
}

export interface ReasonCount {
  reason: Reason;
  kind: ReasonKind;
  count: number;
  pct: number | null;
}

/** REQ-001-08 (C-001-10): causas con volumen, ordenadas desc., % sobre incidencias. */
export function buildReasons(counts: Record<Reason, number>): { totalIncidents: number; reasons: ReasonCount[] } {
  const totalIncidents = REASONS.reduce((sum, r) => sum + counts[r], 0);
  const reasons = REASONS.filter((r) => counts[r] > 0)
    .map((reason) => ({
      reason,
      kind: REASON_KIND[reason],
      count: counts[reason],
      pct: pct(counts[reason], totalIncidents),
    }))
    .sort((a, b) => b.count - a.count || REASONS.indexOf(a.reason) - REASONS.indexOf(b.reason));
  return { totalIncidents, reasons };
}
