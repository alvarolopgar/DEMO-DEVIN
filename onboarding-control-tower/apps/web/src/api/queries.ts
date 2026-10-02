import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { api, type Filters } from './client';

const opts = { placeholderData: keepPreviousData, staleTime: 60_000 } as const;

export function useDashboardData(f: Filters) {
  const key = [f.period, f.segment] as const;
  return {
    summary: useQuery({ queryKey: ['summary', ...key], queryFn: () => api.summary(f), ...opts }),
    funnel: useQuery({ queryKey: ['funnel', ...key], queryFn: () => api.funnel(f), ...opts }),
    timeseries: useQuery({ queryKey: ['timeseries', ...key], queryFn: () => api.timeseries(f), ...opts }),
    reasons: useQuery({ queryKey: ['reasons', ...key], queryFn: () => api.reasons(f), ...opts }),
    applications: useQuery({ queryKey: ['applications', ...key], queryFn: () => api.applications(f), ...opts }),
  };
}

export function useApplication(id: string | null) {
  return useQuery({
    queryKey: ['application', id],
    queryFn: () => api.application(id ?? ''),
    enabled: id !== null,
    staleTime: 60_000,
  });
}
