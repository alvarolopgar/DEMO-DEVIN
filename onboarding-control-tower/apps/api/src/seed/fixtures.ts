import type { Reason, Risk, Segment, Status } from '../domain/types.js';

export interface FixtureSpec {
  id: string;
  segment: Segment;
  status: Status;
  risk: Risk;
  /** Segundos antes del instante de referencia en que se inició. */
  startedAgoSec: number;
  durationSec?: number;
  reason?: Reason;
}

/**
 * Solicitudes fijas de los últimos minutos (PLAN §11.5–6): garantizan estados verde, amarillo y rojo
 * simultáneos en la tabla y los ejemplos de AC-001-05/06/07.
 */
export const FIXTURES: readonly FixtureSpec[] = [
  { id: 'CL-10482', segment: 'DIGITAL', status: 'STARTED', risk: 'LOW', startedAgoSec: 45 },
  { id: 'CL-10485', segment: 'OFFICE', status: 'DATA_COMPLETED', risk: 'LOW', startedAgoSec: 95 },
  { id: 'CL-10486', segment: 'DIGITAL', status: 'VERIFYING', risk: 'LOW', startedAgoSec: 124 },
  { id: 'CL-10487', segment: 'PARTNER', status: 'STARTED', risk: 'MEDIUM', startedAgoSec: 190 },
  {
    id: 'CL-10488',
    segment: 'DIGITAL',
    status: 'REJECTED',
    risk: 'HIGH',
    startedAgoSec: 205,
    durationSec: 160,
    reason: 'DOCUMENT_INVALID',
  },
  { id: 'CL-10481', segment: 'DIGITAL', status: 'COMPLETED', risk: 'LOW', startedAgoSec: 230, durationSec: 212 },
  { id: 'CL-10489', segment: 'DIGITAL', status: 'VERIFYING', risk: 'MEDIUM', startedAgoSec: 129 },
  { id: 'CL-10490', segment: 'OFFICE', status: 'DATA_COMPLETED', risk: 'MEDIUM', startedAgoSec: 135 },
  { id: 'CL-10491', segment: 'DIGITAL', status: 'VERIFYING', risk: 'LOW', startedAgoSec: 140 },
  { id: 'CL-10492', segment: 'PARTNER', status: 'VERIFYING', risk: 'MEDIUM', startedAgoSec: 146 },
  { id: 'CL-10483', segment: 'DIGITAL', status: 'VERIFYING', risk: 'MEDIUM', startedAgoSec: 150 },
  { id: 'CL-10493', segment: 'DIGITAL', status: 'DATA_COMPLETED', risk: 'MEDIUM', startedAgoSec: 156 },
  { id: 'CL-10494', segment: 'OFFICE', status: 'VERIFYING', risk: 'LOW', startedAgoSec: 162 },
  { id: 'CL-10495', segment: 'DIGITAL', status: 'STARTED', risk: 'MEDIUM', startedAgoSec: 168 },
  { id: 'CL-10496', segment: 'PARTNER', status: 'VERIFYING', risk: 'HIGH', startedAgoSec: 174 },
  { id: 'CL-10497', segment: 'DIGITAL', status: 'VERIFYING', risk: 'MEDIUM', startedAgoSec: 179 },
  { id: 'CL-10484', segment: 'PARTNER', status: 'VERIFYING', risk: 'HIGH', startedAgoSec: 181 },
  { id: 'CL-10498', segment: 'DIGITAL', status: 'VERIFYING', risk: 'HIGH', startedAgoSec: 335 },
  { id: 'CL-10499', segment: 'OFFICE', status: 'DATA_COMPLETED', risk: 'MEDIUM', startedAgoSec: 372 },
  { id: 'CL-10500', segment: 'DIGITAL', status: 'VERIFYING', risk: 'HIGH', startedAgoSec: 410 },
  { id: 'CL-10501', segment: 'PARTNER', status: 'DATA_COMPLETED', risk: 'HIGH', startedAgoSec: 468 },
  { id: 'CL-10502', segment: 'DIGITAL', status: 'VERIFYING', risk: 'HIGH', startedAgoSec: 525 },
  { id: 'CL-10503', segment: 'DIGITAL', status: 'STARTED', risk: 'MEDIUM', startedAgoSec: 590 },
  { id: 'CL-10504', segment: 'OFFICE', status: 'VERIFYING', risk: 'HIGH', startedAgoSec: 660 },
  { id: 'CL-10505', segment: 'PARTNER', status: 'VERIFYING', risk: 'HIGH', startedAgoSec: 745 },
  { id: 'CL-10506', segment: 'DIGITAL', status: 'DATA_COMPLETED', risk: 'HIGH', startedAgoSec: 830 },
  { id: 'CL-10507', segment: 'DIGITAL', status: 'COMPLETED', risk: 'LOW', startedAgoSec: 905, durationSec: 228 },
  { id: 'CL-10508', segment: 'OFFICE', status: 'COMPLETED', risk: 'LOW', startedAgoSec: 980, durationSec: 251 },
  {
    id: 'CL-10509',
    segment: 'PARTNER',
    status: 'REJECTED',
    risk: 'HIGH',
    startedAgoSec: 1050,
    durationSec: 270,
    reason: 'IDENTITY_FAILED',
  },
  { id: 'CL-10510', segment: 'DIGITAL', status: 'COMPLETED', risk: 'LOW', startedAgoSec: 1130, durationSec: 196 },
];
