import type { components } from './generated/openapi';

type S = components['schemas'];
export type Period = S['Period'];
export type SegmentFilter = S['SegmentFilter'];
export type Segment = S['Segment'];
export type Status = S['Status'];
export type Risk = S['Risk'];
export type SlaStatus = S['SlaStatus'];
export type HealthLight = S['HealthLight'];
export type FunnelStage = S['FunnelStage'];
export type Reason = S['Reason'];
export type EventType = S['EventType'];
export type DashboardSummary = S['DashboardSummary'];
export type Funnel = S['Funnel'];
export type Timeseries = S['Timeseries'];
export type Reasons = S['Reasons'];
export type ApplicationList = S['ApplicationList'];
export type ApplicationSummary = S['ApplicationSummary'];
export type ApplicationDetail = S['ApplicationDetail'];
export type Problem = S['Problem'];

export const PERIODS: readonly Period[] = ['today', '7d', '30d'];
export const SEGMENTS: readonly SegmentFilter[] = ['ALL', 'DIGITAL', 'OFFICE', 'PARTNER'];
