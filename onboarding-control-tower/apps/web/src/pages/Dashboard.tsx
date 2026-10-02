import type { ReactNode } from 'react';
import { useDashboardData } from '../api/queries';
import { ApplicationDrawer } from '../components/ApplicationDrawer';
import { ApplicationsTable } from '../components/ApplicationsTable';
import { DashboardHeader } from '../components/DashboardHeader';
import { EmptyState } from '../components/EmptyState';
import { ErrorState } from '../components/ErrorState';
import { ExecutiveAlert } from '../components/ExecutiveAlert';
import { FunnelChart } from '../components/FunnelChart';
import { HealthPanel } from '../components/HealthPanel';
import { KpiCard, type Trend } from '../components/KpiCard';
import { ReasonsChart } from '../components/ReasonsChart';
import { SlaCard } from '../components/SlaCard';
import { DashboardSkeleton, Skeleton } from '../components/Skeleton';
import { StatusDonut } from '../components/StatusDonut';
import { TrendChart } from '../components/TrendChart';
import { useDashboardFilters } from '../hooks/useDashboardFilters';
import { formatDuration, formatInt, formatPct, formatSignedPct, formatSignedPp, formatSignedSec } from '../i18n/format';
import { PERIOD_PREVIOUS } from '../i18n/labels';

const trend = (d: number | null): Trend => (d === null || d === 0 ? 'flat' : d > 0 ? 'up' : 'down');

const Icon = ({ d }: { d: string }) => (
  <svg
    viewBox="0 0 24 24"
    className="h-4 w-4"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d={d} />
  </svg>
);

export function Dashboard() {
  const filters = useDashboardFilters();
  const { period, segment } = filters;
  const queries = useDashboardData({ period, segment });
  const all = Object.values(queries);
  const failed = all.some((q) => q.isError);
  const fetching = all.some((q) => q.isFetching);
  const s = queries.summary.data;
  const comparison = PERIOD_PREVIOUS[period];

  const retry = () => {
    for (const q of all) if (q.isError) void q.refetch();
  };

  let content: ReactNode;
  if (failed) content = <ErrorState onRetry={retry} />;
  else if (!s) content = <DashboardSkeleton />;
  else {
    const { funnel, timeseries, reasons, applications } = queries;
    content = (
      <div className="grid grid-cols-12 gap-5">
        {s.health.alert && (
          <div className="col-span-12">
            <ExecutiveAlert message={s.health.alert} />
          </div>
        )}
        <div className="col-span-12">
          <HealthPanel summary={s} />
        </div>
        <div className="col-span-12 grid grid-cols-4 gap-5">
          <KpiCard
            id="applications"
            label="Solicitudes"
            value={s.isEmpty ? '—' : formatInt(s.kpis.applications.value)}
            delta={s.kpis.applications.deltaPct === null ? null : formatSignedPct(s.kpis.applications.deltaPct)}
            trend={trend(s.kpis.applications.deltaPct)}
            good="up"
            comparison={comparison}
            icon={<Icon d="M4 6h16M4 12h16M4 18h10" />}
          />
          <KpiCard
            id="conversion"
            label="Conversión"
            value={formatPct(s.kpis.conversionPct.value)}
            delta={s.kpis.conversionPct.deltaPct === null ? null : formatSignedPp(s.kpis.conversionPct.deltaPct)}
            trend={trend(s.kpis.conversionPct.deltaPct)}
            good="up"
            comparison={comparison}
            hint="Completadas / iniciadas"
            icon={<Icon d="M4 4h16l-6 8v6l-4 2v-8z" />}
          />
          <KpiCard
            id="duration"
            label="Tiempo medio"
            value={formatDuration(s.kpis.avgDurationSec.value)}
            delta={s.kpis.avgDurationSec.deltaSec === null ? null : formatSignedSec(s.kpis.avgDurationSec.deltaSec)}
            trend={trend(s.kpis.avgDurationSec.deltaSec)}
            good="down"
            comparison={comparison}
            hint="Solicitudes completadas"
            icon={<Icon d="M12 7v5l3 2M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z" />}
          />
          <KpiCard
            id="sla"
            label="SLA"
            value={formatPct(s.kpis.slaPct.value)}
            delta={s.kpis.slaPct.deltaPct === null ? null : formatSignedPp(s.kpis.slaPct.deltaPct)}
            trend={trend(s.kpis.slaPct.deltaPct)}
            good="up"
            comparison={comparison}
            hint={`Objetivo ${formatPct(s.kpis.slaPct.target)}`}
            icon={<Icon d="M5 13l4 4L19 7" />}
          />
        </div>
        {s.isEmpty ? (
          <EmptyState onReset={() => filters.update({ period: '30d', segment: 'ALL' })} />
        ) : (
          <>
            {funnel.data ? <FunnelChart funnel={funnel.data} /> : <Skeleton className="col-span-7 h-80" />}
            <StatusDonut summary={s} />
            {timeseries.data ? <TrendChart series={timeseries.data} /> : <Skeleton className="col-span-12 h-72" />}
            {reasons.data ? <ReasonsChart reasons={reasons.data} /> : <Skeleton className="col-span-7 h-72" />}
            <SlaCard summary={s} />
            {applications.data ? (
              <ApplicationsTable list={applications.data} selectedId={filters.app} onSelect={filters.openApplication} />
            ) : (
              <Skeleton className="col-span-12 h-96" />
            )}
          </>
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <DashboardHeader
        period={period}
        segment={segment}
        referenceNow={s?.referenceNow}
        onPeriod={filters.setPeriod}
        onSegment={filters.setSegment}
      />
      <main
        className="mx-auto max-w-[1600px] px-8 py-6"
        aria-busy={fetching}
        data-testid="dashboard"
        data-loaded={s ? `${s.period}|${s.segment}` : ''}
      >
        {content}
      </main>
      {filters.app && <ApplicationDrawer id={filters.app} onClose={filters.closeApplication} />}
    </div>
  );
}
