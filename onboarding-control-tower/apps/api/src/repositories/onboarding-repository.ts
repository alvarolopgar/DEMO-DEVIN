import { Prisma, type PrismaClient } from '@prisma/client';
import { SLA_THRESHOLD_SECONDS, WARNING_THRESHOLD_SECONDS } from '../domain/constants.js';
import type { BucketStatusCount } from '../domain/timeseries.js';
import {
  ACTIVE_STATUSES,
  FUNNEL_STAGES,
  REASONS,
  STATUSES,
  VERIFICATION_REASONS,
  type FunnelStage,
  type Reason,
  type SegmentFilter,
  type Status,
} from '../domain/types.js';

export interface Window {
  from: Date;
  to: Date;
  segment: SegmentFilter;
}

export interface ActiveSlaCounts {
  total: number;
  within: number;
  warning: number;
  breached: number;
}

const zeroed = <K extends string>(keys: readonly K[]): Record<K, number> =>
  Object.fromEntries(keys.map((k) => [k, 0])) as Record<K, number>;

/** Acceso a datos con agregaciones en SQLite (PLAN §16). */
export class OnboardingRepository {
  constructor(private readonly prisma: PrismaClient) {}

  private where(w: Window): Prisma.OnboardingApplicationWhereInput {
    return {
      startedAt: { gte: w.from, lt: w.to },
      ...(w.segment === 'ALL' ? {} : { segment: w.segment }),
    };
  }

  async count(w: Window): Promise<number> {
    return this.prisma.onboardingApplication.count({ where: this.where(w) });
  }

  async countByStatus(w: Window): Promise<Record<Status, number>> {
    const rows = await this.prisma.onboardingApplication.groupBy({
      by: ['status'],
      where: this.where(w),
      _count: true,
    });
    const out = zeroed(STATUSES);
    for (const r of rows) out[r.status] = r._count;
    return out;
  }

  async countByStage(w: Window): Promise<Record<FunnelStage, number>> {
    const rows = await this.prisma.onboardingApplication.groupBy({ by: ['stage'], where: this.where(w), _count: true });
    const out = zeroed(FUNNEL_STAGES);
    for (const r of rows) out[r.stage] = r._count;
    return out;
  }

  async countByReason(w: Window): Promise<Record<Reason, number>> {
    const rows = await this.prisma.onboardingApplication.groupBy({
      by: ['rejectionReason'],
      where: { ...this.where(w), status: { in: ['REJECTED', 'EXPIRED'] } },
      _count: true,
    });
    const out = zeroed(REASONS);
    for (const r of rows) if (r.rejectionReason) out[r.rejectionReason] = r._count;
    return out;
  }

  /** BR-002 / BR-003: duración total, nº de completadas y completadas dentro del umbral. */
  async completedDurations(w: Window): Promise<{ count: number; totalSec: number; within: number }> {
    const where = { ...this.where(w), status: 'COMPLETED' as const };
    const [agg, within] = await Promise.all([
      this.prisma.onboardingApplication.aggregate({ where, _count: true, _sum: { durationSec: true } }),
      this.prisma.onboardingApplication.count({ where: { ...where, durationSec: { lte: SLA_THRESHOLD_SECONDS } } }),
    ]);
    return { count: agg._count, totalSec: agg._sum.durationSec ?? 0, within };
  }

  /** BR-004 / BR-005: clasificación de activas por tiempo transcurrido respecto a `now` (segundos enteros). */
  async activeSla(w: Window, now: Date): Promise<ActiveSlaCounts> {
    const base = { ...this.where(w), status: { in: [...ACTIVE_STATUSES] } };
    const warnLimit = new Date(now.getTime() - (WARNING_THRESHOLD_SECONDS + 1) * 1000);
    const slaLimit = new Date(now.getTime() - (SLA_THRESHOLD_SECONDS + 1) * 1000);
    const and = (startedAt: Prisma.DateTimeFilter) => ({ AND: [base, { startedAt }] });
    const [total, within, breached] = await Promise.all([
      this.prisma.onboardingApplication.count({ where: base }),
      this.prisma.onboardingApplication.count({ where: and({ gt: warnLimit }) }),
      this.prisma.onboardingApplication.count({ where: and({ lte: slaLimit }) }),
    ]);
    return { total, within, warning: total - within - breached, breached };
  }

  /** BR-006: solicitudes que alcanzaron verificación y rechazadas en ella. */
  async verification(w: Window): Promise<{ reached: number; rejected: number }> {
    const [reached, rejected] = await Promise.all([
      this.prisma.onboardingApplication.count({
        where: { ...this.where(w), stage: { in: ['VERIFICATION', 'CUSTOMER_CREATED'] } },
      }),
      this.prisma.onboardingApplication.count({
        where: { ...this.where(w), status: 'REJECTED', rejectionReason: { in: [...VERIFICATION_REASONS] } },
      }),
    ]);
    return { reached, rejected };
  }

  async countByBucket(w: Window, bucketMs: number): Promise<BucketStatusCount[]> {
    const from = w.from.getTime();
    const segment = w.segment === 'ALL' ? Prisma.empty : Prisma.sql`AND segment = ${w.segment}`;
    const rows = await this.prisma.$queryRaw<{ bucket: bigint | number; status: Status; count: bigint | number }[]>`
      SELECT CAST((startedAt - ${from}) / ${bucketMs} AS INTEGER) AS bucket, status, COUNT(*) AS count
      FROM OnboardingApplication
      WHERE startedAt >= ${from} AND startedAt < ${w.to.getTime()} ${segment}
      GROUP BY bucket, status`;
    return rows.map((r) => ({ bucket: Number(r.bucket), status: r.status, count: Number(r.count) }));
  }

  async latest(w: Window, limit: number) {
    return this.prisma.onboardingApplication.findMany({
      where: this.where(w),
      orderBy: [{ startedAt: 'desc' }, { id: 'desc' }],
      take: limit,
      select: { id: true, segment: true, status: true, risk: true, startedAt: true, closedAt: true },
    });
  }

  async findById(id: string) {
    return this.prisma.onboardingApplication.findUnique({
      where: { id },
      include: { events: { orderBy: [{ occurredAt: 'asc' }, { id: 'asc' }] } },
    });
  }

  async anchor(): Promise<Date | null> {
    const meta = await this.prisma.datasetMeta.findUnique({ where: { id: 1 } });
    return meta?.anchor ?? null;
  }

  async ping(): Promise<void> {
    await this.prisma.$queryRaw`SELECT 1`;
  }
}
