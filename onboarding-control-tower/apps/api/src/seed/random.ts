/** PRNG determinista mulberry32 (PLAN §11). */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function logNormal(rng: () => number, median: number, sigma: number): number {
  const u1 = Math.max(rng(), Number.EPSILON);
  const u2 = rng();
  const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
  return median * Math.exp(sigma * z);
}

export function pick<T>(rng: () => number, weighted: readonly (readonly [T, number])[]): T {
  const total = weighted.reduce((s, [, w]) => s + w, 0);
  let r = rng() * total;
  for (const [value, w] of weighted) {
    r -= w;
    if (r < 0) return value;
  }
  const last = weighted[weighted.length - 1];
  if (!last) throw new Error('pick: lista vacía');
  return last[0];
}
