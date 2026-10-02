export function round1(value: number): number {
  return Math.round(value * 10) / 10;
}

export function pct(numerator: number, denominator: number): number | null {
  return denominator > 0 ? round1((numerator / denominator) * 100) : null;
}

/** BR-001 */
export function conversionPct(completed: number, started: number): number | null {
  return pct(completed, started);
}

/** BR-002 */
export function averageSeconds(totalSeconds: number, count: number): number | null {
  return count > 0 ? Math.round(totalSeconds / count) : null;
}

/** BR-007: variación relativa (%) frente al periodo anterior. */
export function deltaRelativePct(current: number, previous: number): number | null {
  return previous > 0 ? round1(((current - previous) / previous) * 100) : null;
}

/** BR-007: diferencia absoluta (pp o segundos) frente al periodo anterior. */
export function deltaPoints(current: number | null, previous: number | null): number | null {
  return current === null || previous === null ? null : round1(current - previous);
}
