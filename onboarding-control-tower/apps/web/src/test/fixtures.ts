import type { ApplicationDetail, ApplicationList, DashboardSummary, Funnel, Reasons, Timeseries } from '../api/types';

const echo = {
  period: '30d' as const,
  segment: 'ALL' as const,
  referenceNow: '2026-10-01T10:00:00.000Z',
  range: { from: '2026-09-01T10:00:00.000Z', to: '2026-10-01T10:00:00.000Z' },
  previousRange: { from: '2026-08-02T10:00:00.000Z', to: '2026-09-01T10:00:00.000Z' },
  isEmpty: false,
};

export const summary: DashboardSummary = {
  ...echo,
  kpis: {
    applications: { value: 12920, previous: 11882, deltaPct: 8.7 },
    conversionPct: { value: 78.9, previous: 80.9, deltaPct: -2 },
    avgDurationSec: { value: 235, previous: 235, deltaSec: 0 },
    slaPct: { value: 92.4, previous: 92, deltaPct: 0.4, target: 95 },
  },
  sla: {
    thresholdSec: 300,
    activeThresholdSec: 180,
    warningSec: 120,
    targetPct: 95,
    compliancePct: 92.4,
    activeCount: 24,
    activeWithinCount: 14,
    activeWithinPct: 58.3,
    warningCount: 10,
    breachedCount: 10,
  },
  statusBreakdown: [
    { status: 'STARTED', count: 6, pct: 0 },
    { status: 'DATA_COMPLETED', count: 7, pct: 0.1 },
    { status: 'VERIFYING', count: 11, pct: 0.1 },
    { status: 'COMPLETED', count: 10194, pct: 78.9 },
    { status: 'REJECTED', count: 1280, pct: 9.9 },
    { status: 'EXPIRED', count: 1422, pct: 11 },
  ],
  health: {
    conversion: 'GREEN',
    sla: 'AMBER',
    verification: 'RED',
    verificationError: { valuePct: 8.6, previousPct: 6.7, changePct: 27.2 },
    alert: 'Los errores de verificación han aumentado un 27 % frente al periodo anterior.',
  },
};

export const emptySummary: DashboardSummary = {
  ...summary,
  isEmpty: true,
  kpis: {
    applications: { value: 0, previous: 0, deltaPct: null },
    conversionPct: { value: null, previous: null, deltaPct: null },
    avgDurationSec: { value: null, previous: null, deltaSec: null },
    slaPct: { value: null, previous: null, deltaPct: null, target: 95 },
  },
  sla: {
    ...summary.sla,
    compliancePct: null,
    activeCount: 0,
    activeWithinCount: 0,
    activeWithinPct: null,
    warningCount: 0,
    breachedCount: 0,
  },
  statusBreakdown: summary.statusBreakdown.map((s) => ({ ...s, count: 0, pct: null })),
  health: {
    conversion: 'NO_DATA',
    sla: 'NO_DATA',
    verification: 'NO_DATA',
    verificationError: { valuePct: null, previousPct: null, changePct: null },
    alert: null,
  },
};

export const funnel: Funnel = {
  ...echo,
  stages: [
    { stage: 'START', count: 12920, conversionFromPreviousPct: 100, conversionFromStartPct: 100 },
    { stage: 'DATA', count: 12100, conversionFromPreviousPct: 93.7, conversionFromStartPct: 93.7 },
    { stage: 'VERIFICATION', count: 11200, conversionFromPreviousPct: 92.6, conversionFromStartPct: 86.7 },
    { stage: 'CUSTOMER_CREATED', count: 10194, conversionFromPreviousPct: 91, conversionFromStartPct: 78.9 },
  ],
  overallConversionPct: 78.9,
};

export const timeseries: Timeseries = {
  ...echo,
  granularity: 'day',
  points: Array.from({ length: 30 }, (_, i) => ({
    bucketStart: new Date(Date.parse(echo.range.from) + i * 86_400_000).toISOString(),
    completed: 330 + i,
    inProgress: i === 29 ? 24 : 0,
    rejected: 40 + (i % 5),
  })),
};

export const reasons: Reasons = {
  ...echo,
  totalIncidents: 2700,
  reasons: [
    { reason: 'DOCUMENT_INVALID', kind: 'REJECTION', count: 840, pct: 31.1 },
    { reason: 'INCOMPLETE', kind: 'ABANDONMENT', count: 728, pct: 27 },
    { reason: 'ABANDONED', kind: 'ABANDONMENT', count: 695, pct: 25.7 },
    { reason: 'OTHER', kind: 'REJECTION', count: 321, pct: 11.9 },
    { reason: 'IDENTITY_FAILED', kind: 'REJECTION', count: 116, pct: 4.3 },
  ],
};

export const applications: ApplicationList = {
  ...echo,
  items: [
    {
      id: 'CL-10481',
      segment: 'DIGITAL',
      status: 'COMPLETED',
      risk: 'LOW',
      startedAt: '2026-10-01T09:56:10.000Z',
      elapsedSec: 212,
      slaStatus: 'WITHIN',
    },
    {
      id: 'CL-10483',
      segment: 'DIGITAL',
      status: 'VERIFYING',
      risk: 'MEDIUM',
      startedAt: '2026-10-01T09:57:30.000Z',
      elapsedSec: 150,
      slaStatus: 'WARNING',
    },
    {
      id: 'CL-10484',
      segment: 'PARTNER',
      status: 'VERIFYING',
      risk: 'HIGH',
      startedAt: '2026-10-01T09:56:59.000Z',
      elapsedSec: 181,
      slaStatus: 'BREACHED',
    },
  ],
};

export const detail: ApplicationDetail = {
  id: 'CL-10481',
  segment: 'DIGITAL',
  status: 'COMPLETED',
  risk: 'LOW',
  startedAt: '2026-10-01T09:56:10.000Z',
  closedAt: '2026-10-01T09:59:42.000Z',
  elapsedSec: 212,
  slaStatus: 'WITHIN',
  rejectionReason: null,
  referenceNow: '2026-10-01T10:00:00.000Z',
  events: [
    { type: 'STARTED', occurredAt: '2026-10-01T09:56:10.000Z', offsetSec: 0 },
    { type: 'DATA_COMPLETED', occurredAt: '2026-10-01T09:57:24.000Z', offsetSec: 74 },
    { type: 'DOCUMENT_VALIDATED', occurredAt: '2026-10-01T09:58:21.000Z', offsetSec: 131 },
    { type: 'IDENTITY_VERIFIED', occurredAt: '2026-10-01T09:59:12.000Z', offsetSec: 182 },
    { type: 'CUSTOMER_CREATED', occurredAt: '2026-10-01T09:59:42.000Z', offsetSec: 212 },
  ],
};

type Routes = Record<string, unknown>;

export const defaultRoutes: Routes = {
  '/api/dashboard/summary': summary,
  '/api/dashboard/funnel': funnel,
  '/api/dashboard/timeseries': timeseries,
  '/api/dashboard/reasons': reasons,
  '/api/applications': applications,
  '/api/applications/CL-10481': detail,
};

/** Sustituye `fetch` con respuestas por ruta; `status` permite simular errores. */
export function mockFetch(routes: Routes = defaultRoutes, status: (path: string) => number = () => 200) {
  const calls: string[] = [];
  const fn = async (input: RequestInfo | URL) => {
    const url = new URL(String(input), 'http://localhost');
    calls.push(`${url.pathname}${url.search}`);
    const code = status(url.pathname);
    const body = code === 200 ? routes[url.pathname] : { type: 'urn:x', title: 'Internal Server Error', status: code };
    return new Response(JSON.stringify(body ?? null), {
      status: body === undefined ? 404 : code,
      headers: { 'content-type': 'application/json' },
    });
  };
  globalThis.fetch = fn as typeof fetch;
  return calls;
}
