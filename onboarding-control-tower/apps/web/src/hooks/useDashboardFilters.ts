import { useCallback, useSyncExternalStore } from 'react';
import { PERIODS, SEGMENTS, type Period, type SegmentFilter } from '../api/types';

/** REQ-001-18 / C-001-15: periodo, segmento y solicitud abierta viven en la URL. */
export interface DashboardUrlState {
  period: Period;
  segment: SegmentFilter;
  app: string | null;
}

const EVENT = 'oct:urlchange';

function subscribe(cb: () => void) {
  window.addEventListener('popstate', cb);
  window.addEventListener(EVENT, cb);
  return () => {
    window.removeEventListener('popstate', cb);
    window.removeEventListener(EVENT, cb);
  };
}

const getSearch = () => window.location.search;

export function parseState(search: string): DashboardUrlState {
  const p = new URLSearchParams(search);
  const period = p.get('period');
  const segment = p.get('segment');
  const app = p.get('app');
  return {
    period: PERIODS.includes(period as Period) ? (period as Period) : '30d',
    segment: SEGMENTS.includes(segment as SegmentFilter) ? (segment as SegmentFilter) : 'ALL',
    app: app && /^CL-\d{5}$/.test(app) ? app : null,
  };
}

export function useDashboardFilters() {
  const search = useSyncExternalStore(subscribe, getSearch, getSearch);
  const state = parseState(search);

  const update = useCallback((patch: Partial<DashboardUrlState>, mode: 'push' | 'replace' = 'push') => {
    const next = { ...parseState(window.location.search), ...patch };
    const p = new URLSearchParams();
    p.set('period', next.period);
    p.set('segment', next.segment);
    if (next.app) p.set('app', next.app);
    const url = `${window.location.pathname}?${p.toString()}`;
    if (mode === 'push') window.history.pushState(null, '', url);
    else window.history.replaceState(null, '', url);
    window.dispatchEvent(new Event(EVENT));
  }, []);

  return {
    ...state,
    update,
    setPeriod: (period: Period) => update({ period }),
    setSegment: (segment: SegmentFilter) => update({ segment }),
    openApplication: (app: string) => update({ app }),
    closeApplication: () => update({ app: null }),
  };
}
