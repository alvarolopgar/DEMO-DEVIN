import type {
  ApplicationDetail,
  ApplicationList,
  DashboardSummary,
  Funnel,
  Period,
  Problem,
  Reasons,
  SegmentFilter,
  Timeseries,
} from './types';

export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly problem: Problem | null,
  ) {
    super(problem?.title ?? `HTTP ${status}`);
  }
}

async function get<T>(path: string, params?: Record<string, string | number>): Promise<T> {
  const qs = params ? `?${new URLSearchParams(Object.entries(params).map(([k, v]) => [k, String(v)]))}` : '';
  const res = await fetch(`${path}${qs}`, { headers: { accept: 'application/json' } });
  if (!res.ok) {
    const problem = (await res.json().catch(() => null)) as Problem | null;
    throw new ApiError(res.status, problem);
  }
  return (await res.json()) as T;
}

export interface Filters {
  period: Period;
  segment: SegmentFilter;
}

export const api = {
  summary: (f: Filters) => get<DashboardSummary>('/api/dashboard/summary', { ...f }),
  funnel: (f: Filters) => get<Funnel>('/api/dashboard/funnel', { ...f }),
  timeseries: (f: Filters) => get<Timeseries>('/api/dashboard/timeseries', { ...f }),
  reasons: (f: Filters) => get<Reasons>('/api/dashboard/reasons', { ...f }),
  applications: (f: Filters, limit = 20) => get<ApplicationList>('/api/applications', { ...f, limit }),
  application: (id: string) => get<ApplicationDetail>(`/api/applications/${encodeURIComponent(id)}`),
};
