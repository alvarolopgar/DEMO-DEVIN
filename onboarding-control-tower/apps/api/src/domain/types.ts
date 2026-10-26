export const PERIODS = ['today', '7d', '30d'] as const;
export type Period = (typeof PERIODS)[number];

export const SEGMENT_FILTERS = ['ALL', 'DIGITAL', 'OFFICE', 'PARTNER'] as const;
export type SegmentFilter = (typeof SEGMENT_FILTERS)[number];
export type Segment = Exclude<SegmentFilter, 'ALL'>;

export const STATUSES = ['STARTED', 'DATA_COMPLETED', 'VERIFYING', 'COMPLETED', 'REJECTED', 'EXPIRED'] as const;
export type Status = (typeof STATUSES)[number];

export const ACTIVE_STATUSES = ['STARTED', 'DATA_COMPLETED', 'VERIFYING'] as const satisfies readonly Status[];

export const FUNNEL_STAGES = ['START', 'DATA', 'VERIFICATION', 'CUSTOMER_CREATED'] as const;
export type FunnelStage = (typeof FUNNEL_STAGES)[number];

export const REASONS = ['DOCUMENT_INVALID', 'IDENTITY_FAILED', 'OTHER', 'ABANDONED', 'INCOMPLETE'] as const;
export type Reason = (typeof REASONS)[number];

export const VERIFICATION_REASONS = ['DOCUMENT_INVALID', 'IDENTITY_FAILED'] as const satisfies readonly Reason[];

export type Risk = 'LOW' | 'MEDIUM' | 'HIGH';
export type SlaStatus = 'WITHIN' | 'WARNING' | 'BREACHED' | 'NOT_EVALUATED';
export type HealthLight = 'GREEN' | 'AMBER' | 'RED' | 'NO_DATA';
export type EventType = 'STARTED' | 'DATA_COMPLETED' | 'DOCUMENT_VALIDATED' | 'IDENTITY_VERIFIED' | 'CUSTOMER_CREATED';

export function isActive(status: Status): boolean {
  return (ACTIVE_STATUSES as readonly Status[]).includes(status);
}
