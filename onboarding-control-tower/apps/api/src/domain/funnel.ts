import { pct } from './metrics.js';
import { FUNNEL_STAGES, type FunnelStage } from './types.js';

export interface FunnelStep {
  stage: FunnelStage;
  count: number;
  conversionFromPreviousPct: number | null;
  conversionFromStartPct: number | null;
}

export interface FunnelResult {
  stages: FunnelStep[];
  overallConversionPct: number | null;
}

/**
 * REQ-001-05 (C-001-09): recibe el nº de solicitudes cuya etapa más avanzada es cada etapa
 * y devuelve las alcanzadas de forma acumulada con su conversión.
 */
export function buildFunnel(maxStageCounts: Record<FunnelStage, number>): FunnelResult {
  const reached = FUNNEL_STAGES.map((_, i) =>
    FUNNEL_STAGES.slice(i).reduce((sum, stage) => sum + maxStageCounts[stage], 0),
  );
  const start = reached[0] ?? 0;
  const stages = FUNNEL_STAGES.map((stage, i) => {
    const count = reached[i] ?? 0;
    const previous = i === 0 ? count : (reached[i - 1] ?? 0);
    return {
      stage,
      count,
      conversionFromPreviousPct: pct(count, previous),
      conversionFromStartPct: pct(count, start),
    };
  });
  return { stages, overallConversionPct: stages[stages.length - 1]?.conversionFromStartPct ?? null };
}
