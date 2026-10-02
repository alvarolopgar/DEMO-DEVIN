import { createHash } from 'node:crypto';
import { beforeAll, describe, expect, test } from 'vitest';
import { classifySla, elapsedSeconds } from '../../src/domain/sla.js';
import { resolvePeriod } from '../../src/domain/period.js';
import { isActive } from '../../src/domain/types.js';
import { verificationAlert } from '../../src/domain/health.js';
import {
  DEFAULT_ANCHOR,
  DEFAULT_SEED,
  generateDataset,
  type Dataset,
  type SeedApplication,
} from '../../src/seed/generate.js';

let ds: Dataset;
const anchor = new Date(DEFAULT_ANCHOR);

function inWindow(apps: SeedApplication[], from: Date, to: Date) {
  return apps.filter((a) => a.startedAt >= from && a.startedAt < to);
}

function stats(apps: SeedApplication[]) {
  const completed = apps.filter((a) => a.status === 'COMPLETED');
  const rejected = apps.filter((a) => a.status === 'REJECTED');
  const incidents = apps.filter((a) => a.status === 'REJECTED' || a.status === 'EXPIRED');
  const evaluable = apps.filter((a) => a.status === 'COMPLETED' || isActive(a.status));
  const within = evaluable.filter((a) => classifySla(a.status, elapsedSeconds(a, anchor)) !== 'BREACHED');
  const reachedVerification = apps.filter((a) => a.stage === 'VERIFICATION' || a.stage === 'CUSTOMER_CREATED');
  const verificationRejected = rejected.filter(
    (a) => a.rejectionReason === 'DOCUMENT_INVALID' || a.rejectionReason === 'IDENTITY_FAILED',
  );
  return {
    total: apps.length,
    conversion: (completed.length / apps.length) * 100,
    avgDuration: completed.reduce((s, a) => s + (a.durationSec ?? 0), 0) / completed.length,
    sla: (within.length / evaluable.length) * 100,
    rejected: (rejected.length / apps.length) * 100,
    documentInvalidShare:
      (incidents.filter((a) => a.rejectionReason === 'DOCUMENT_INVALID').length / incidents.length) * 100,
    verificationError: (verificationRejected.length / reachedVerification.length) * 100,
  };
}

beforeAll(() => {
  ds = generateDataset({ anchor, seed: DEFAULT_SEED });
});

describe('Seed determinista (PLAN §11, SPEC §10)', () => {
  test('[REQ-001-20] el seed es determinista: misma semilla → mismo dataset', () => {
    const hash = (d: Dataset) => createHash('sha256').update(JSON.stringify(d)).digest('hex');
    expect(hash(generateDataset({ anchor, seed: DEFAULT_SEED }))).toBe(hash(ds));
    expect(hash(generateDataset({ anchor, seed: DEFAULT_SEED + 1 }))).not.toBe(hash(ds));
  });

  test('[REQ-001-01] proporciones de 30 días coherentes con la narrativa de la demo', () => {
    const p = resolvePeriod('30d', anchor);
    const s = stats(inWindow(ds.applications, p.current.from, p.current.to));
    expect(s.total).toBeGreaterThanOrEqual(12000);
    expect(s.total).toBeLessThanOrEqual(13000);
    expect(s.conversion).toBeGreaterThanOrEqual(77);
    expect(s.conversion).toBeLessThanOrEqual(80);
    expect(s.avgDuration).toBeGreaterThanOrEqual(220);
    expect(s.avgDuration).toBeLessThanOrEqual(260);
    expect(s.sla).toBeGreaterThanOrEqual(91);
    expect(s.sla).toBeLessThanOrEqual(93);
    expect(s.rejected).toBeGreaterThanOrEqual(8);
    expect(s.rejected).toBeLessThanOrEqual(10);
    expect(s.documentInvalidShare).toBeGreaterThanOrEqual(30);
    expect(s.documentInvalidShare).toBeLessThanOrEqual(35);
  });

  test('[REQ-001-08] Documento inválido es la causa principal de incidencias en 30 días', () => {
    const p = resolvePeriod('30d', anchor);
    const counts = new Map<string, number>();
    for (const a of inWindow(ds.applications, p.current.from, p.current.to))
      if (a.rejectionReason) counts.set(a.rejectionReason, (counts.get(a.rejectionReason) ?? 0) + 1);
    const top = [...counts.entries()].sort((x, y) => y[1] - x[1])[0];
    expect(top?.[0]).toBe('DOCUMENT_INVALID');
  });

  test('[REQ-001-04] Digital mayoritario y Partner con peor conversión', () => {
    const p = resolvePeriod('30d', anchor);
    const apps = inWindow(ds.applications, p.current.from, p.current.to);
    const share = (seg: string) => (apps.filter((a) => a.segment === seg).length / apps.length) * 100;
    expect(share('DIGITAL')).toBeGreaterThan(67);
    expect(share('DIGITAL')).toBeLessThan(73);
    expect(share('OFFICE')).toBeGreaterThan(17);
    expect(share('PARTNER')).toBeGreaterThan(8);
    const conv = (seg: string) => stats(apps.filter((a) => a.segment === seg)).conversion;
    expect(conv('PARTNER')).toBeLessThan(conv('DIGITAL') - 8);
    expect(conv('PARTNER')).toBeLessThan(conv('OFFICE') - 8);
  });

  test('[AC-001-08] el error de verificación crece más de un 20 % en 30 y 7 días', () => {
    for (const period of ['30d', '7d'] as const) {
      const p = resolvePeriod(period, anchor);
      const cur = stats(inWindow(ds.applications, p.current.from, p.current.to)).verificationError;
      const prev = stats(inWindow(ds.applications, p.previous.from, p.previous.to)).verificationError;
      expect(verificationAlert(cur, prev).alert, period).not.toBeNull();
    }
  });

  test('[AC-001-05] fixtures: CL-10483 activa a 2 min 30 s y ≥ 10 activas próximas a SLA', () => {
    const a = ds.applications.find((x) => x.id === 'CL-10483');
    expect(a && isActive(a.status)).toBe(true);
    expect(a && elapsedSeconds(a, anchor)).toBe(150);
    const warning = ds.applications.filter((x) => classifySla(x.status, elapsedSeconds(x, anchor)) === 'WARNING');
    expect(warning.length).toBeGreaterThanOrEqual(10);
  });

  test('[AC-001-06] fixtures: CL-10484 activa a 3 min 01 s y ≥ 10 activas fuera de SLA', () => {
    const a = ds.applications.find((x) => x.id === 'CL-10484');
    expect(a && isActive(a.status)).toBe(true);
    expect(a && elapsedSeconds(a, anchor)).toBe(181);
    const breached = ds.applications.filter(
      (x) => isActive(x.status) && classifySla(x.status, elapsedSeconds(x, anchor)) === 'BREACHED',
    );
    expect(breached.length).toBeGreaterThanOrEqual(10);
  });

  test('[AC-001-07] CL-10481 completada con los 5 eventos del timeline en orden cronológico', () => {
    const events = ds.events.filter((e) => e.applicationId === 'CL-10481');
    expect(events.map((e) => e.type)).toEqual([
      'STARTED',
      'DATA_COMPLETED',
      'DOCUMENT_VALIDATED',
      'IDENTITY_VERIFIED',
      'CUSTOMER_CREATED',
    ]);
    const times = events.map((e) => e.occurredAt.getTime());
    expect([...times].sort((x, y) => x - y)).toEqual(times);
  });

  test('[REQ-001-15] cada solicitud tiene eventos coherentes con su estado', () => {
    const byApp = new Map<string, string[]>();
    for (const e of ds.events) byApp.set(e.applicationId, [...(byApp.get(e.applicationId) ?? []), e.type]);
    for (const a of ds.applications) {
      const types = byApp.get(a.id) ?? [];
      expect(types[0]).toBe('STARTED');
      expect(types.includes('CUSTOMER_CREATED')).toBe(a.status === 'COMPLETED');
    }
  });

  test('[AC-001-10] el dataset solo contiene campos anónimos sin PII', () => {
    const allowed = [
      'id',
      'segment',
      'status',
      'risk',
      'stage',
      'startedAt',
      'completedAt',
      'closedAt',
      'durationSec',
      'rejectionReason',
    ];
    for (const a of ds.applications.slice(0, 500)) {
      expect(Object.keys(a).sort()).toEqual([...allowed].sort());
      expect(a.id).toMatch(/^CL-\d{5}$/);
    }
    expect(new Set(ds.applications.map((a) => a.id)).size).toBe(ds.applications.length);
  });
});
