import {
  ACTIVE_SLA_THRESHOLD_SECONDS,
  SLA_TARGET_PCT,
  SLA_THRESHOLD_SECONDS,
  WARNING_THRESHOLD_SECONDS,
} from '../domain/constants.js';
import { buildFunnel } from '../domain/funnel.js';
import {
  conversionHealth,
  slaHealth,
  verificationAlert,
  verificationErrorPct,
  verificationHealth,
} from '../domain/health.js';
import { averageSeconds, conversionPct, deltaPoints, deltaRelativePct, pct } from '../domain/metrics.js';
import { resolvePeriod, type DateRange, type ResolvedPeriod } from '../domain/period.js';
import { buildReasons } from '../domain/reasons.js';
import { activeWithinPct, classifySla, elapsedSeconds, slaCompliancePct } from '../domain/sla.js';
import { buildTimeseries } from '../domain/timeseries.js';
import { STATUSES, type Period, type SegmentFilter } from '../domain/types.js';
import type { components } from '../generated/openapi.js';
import type { OnboardingRepository, Window } from '../repositories/onboarding-repository.js';

type S = components['schemas'];

const iso = (r: DateRange): S['DateRange'] => ({ from: r.from.toISOString(), to: r.to.toISOString() });

/** Orquesta periodo actual y anterior; todas las reglas proceden de `domain/` (Art. 5). */
export class DashboardService {
  constructor(
    private readonly repo: OnboardingRepository,
    private readonly now: () => Date,
  ) {}

  private windows(period: Period, segment: SegmentFilter) {
    const resolved = resolvePeriod(period, this.now());
    const current: Window = { ...resolved.current, segment };
    const previous: Window = { ...resolved.previous, segment };
    return { resolved, current, previous };
  }

  private echo(resolved: ResolvedPeriod, segment: SegmentFilter, total: number): S['FilterEcho'] {
    return {
      period: resolved.period,
      segment,
      referenceNow: this.now().toISOString(),
      range: iso(resolved.current),
      previousRange: iso(resolved.previous),
      isEmpty: total === 0,
    };
  }

  private async periodMetrics(w: Window) {
    const now = this.now();
    const [statuses, durations, active, verification] = await Promise.all([
      this.repo.countByStatus(w),
      this.repo.completedDurations(w),
      this.repo.activeSla(w, now),
      this.repo.verification(w),
    ]);
    const total = STATUSES.reduce((s, st) => s + statuses[st], 0);
    return {
      total,
      statuses,
      active,
      conversion: conversionPct(statuses.COMPLETED, total),
      avgDuration: averageSeconds(durations.totalSec, durations.count),
      sla: slaCompliancePct({
        completedWithin: durations.within,
        completedTotal: durations.count,
        activeWithin: active.within + active.warning,
        activeTotal: active.total,
      }),
      verificationError: verificationErrorPct(verification.rejected, verification.reached),
    };
  }

  async summary(period: Period, segment: SegmentFilter): Promise<S['DashboardSummary']> {
    const { resolved, current, previous } = this.windows(period, segment);
    const [cur, prev] = await Promise.all([this.periodMetrics(current), this.periodMetrics(previous)]);
    const alert = verificationAlert(cur.verificationError, prev.verificationError);
    return {
      ...this.echo(resolved, segment, cur.total),
      kpis: {
        applications: { value: cur.total, previous: prev.total, deltaPct: deltaRelativePct(cur.total, prev.total) },
        conversionPct: {
          value: cur.conversion,
          previous: prev.conversion,
          deltaPct: deltaPoints(cur.conversion, prev.conversion),
        },
        avgDurationSec: {
          value: cur.avgDuration,
          previous: prev.avgDuration,
          deltaSec: deltaPoints(cur.avgDuration, prev.avgDuration),
        },
        slaPct: {
          value: cur.sla,
          previous: prev.sla,
          deltaPct: deltaPoints(cur.sla, prev.sla),
          target: SLA_TARGET_PCT,
        },
      },
      sla: {
        thresholdSec: SLA_THRESHOLD_SECONDS,
        activeThresholdSec: ACTIVE_SLA_THRESHOLD_SECONDS,
        warningSec: WARNING_THRESHOLD_SECONDS,
        targetPct: SLA_TARGET_PCT,
        compliancePct: cur.sla,
        activeCount: cur.active.total,
        activeWithinCount: cur.active.within + cur.active.warning,
        activeWithinPct: activeWithinPct({
          activeWithin: cur.active.within + cur.active.warning,
          activeTotal: cur.active.total,
        }),
        warningCount: cur.active.warning,
        breachedCount: cur.active.breached,
      },
      statusBreakdown: STATUSES.map((status) => ({
        status,
        count: cur.statuses[status],
        pct: pct(cur.statuses[status], cur.total),
      })),
      health: {
        conversion: conversionHealth(cur.conversion),
        sla: slaHealth(cur.sla),
        verification: verificationHealth(cur.verificationError),
        verificationError: {
          valuePct: cur.verificationError,
          previousPct: prev.verificationError,
          changePct: alert.changePct,
        },
        alert: alert.alert,
      },
    };
  }

  async funnel(period: Period, segment: SegmentFilter): Promise<S['Funnel']> {
    const { resolved, current } = this.windows(period, segment);
    const funnel = buildFunnel(await this.repo.countByStage(current));
    return { ...this.echo(resolved, segment, funnel.stages[0]?.count ?? 0), ...funnel };
  }

  async timeseries(period: Period, segment: SegmentFilter): Promise<S['Timeseries']> {
    const { resolved, current } = this.windows(period, segment);
    const [total, rows] = await Promise.all([
      this.repo.count(current),
      this.repo.countByBucket(current, resolved.bucketMs),
    ]);
    return {
      ...this.echo(resolved, segment, total),
      granularity: resolved.granularity,
      points: buildTimeseries(resolved, rows),
    };
  }

  async reasons(period: Period, segment: SegmentFilter): Promise<S['Reasons']> {
    const { resolved, current } = this.windows(period, segment);
    const [total, counts] = await Promise.all([this.repo.count(current), this.repo.countByReason(current)]);
    return { ...this.echo(resolved, segment, total), ...buildReasons(counts) };
  }

  async applications(period: Period, segment: SegmentFilter, limit: number): Promise<S['ApplicationList']> {
    const { resolved, current } = this.windows(period, segment);
    const now = this.now();
    const [total, rows] = await Promise.all([this.repo.count(current), this.repo.latest(current, limit)]);
    return {
      ...this.echo(resolved, segment, total),
      items: rows.map((r) => {
        const elapsedSec = elapsedSeconds(r, now);
        return {
          id: r.id,
          segment: r.segment,
          status: r.status,
          risk: r.risk,
          startedAt: r.startedAt.toISOString(),
          elapsedSec,
          slaStatus: classifySla(r.status, elapsedSec),
        };
      }),
    };
  }

  async application(id: string): Promise<S['ApplicationDetail'] | null> {
    const app = await this.repo.findById(id);
    if (!app) return null;
    const now = this.now();
    const elapsedSec = elapsedSeconds(app, now);
    return {
      id: app.id,
      segment: app.segment,
      status: app.status,
      risk: app.risk,
      startedAt: app.startedAt.toISOString(),
      closedAt: app.closedAt?.toISOString() ?? null,
      elapsedSec,
      slaStatus: classifySla(app.status, elapsedSec),
      rejectionReason: app.rejectionReason,
      referenceNow: now.toISOString(),
      events: app.events.map((e) => ({
        type: e.type,
        occurredAt: e.occurredAt.toISOString(),
        offsetSec: Math.max(0, Math.round((e.occurredAt.getTime() - app.startedAt.getTime()) / 1000)),
      })),
    };
  }
}
