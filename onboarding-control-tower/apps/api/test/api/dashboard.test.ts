import type { FastifyInstance } from 'fastify';
import { afterAll, beforeAll, describe, expect, test } from 'vitest';
import type { components } from '../../src/generated/openapi.js';
import { createTestApp, EMPTY_NOW, getJson } from '../helpers.js';

type S = components['schemas'];
let app: FastifyInstance;
let empty: FastifyInstance;

beforeAll(async () => {
  app = await createTestApp();
  empty = await createTestApp({ referenceNow: EMPTY_NOW });
});
afterAll(async () => {
  await app.close();
  await empty.close();
});

const q = (period: string, segment: string) => `?period=${period}&segment=${segment}`;

describe('API dashboard', () => {
  test('[AC-001-01] la vista inicial (30 días, Todos) devuelve KPIs, funnel, evolución, distribución, causas, SLA y solicitudes', async () => {
    const s = await getJson<S['DashboardSummary']>(app, '/api/dashboard/summary');
    expect(s.period).toBe('30d');
    expect(s.segment).toBe('ALL');
    expect(s.isEmpty).toBe(false);
    expect(s.kpis.applications.value).toBeGreaterThan(12000);
    expect(s.kpis.conversionPct.value).not.toBeNull();
    expect(s.kpis.avgDurationSec.value).not.toBeNull();
    expect(s.kpis.slaPct.value).not.toBeNull();
    expect(s.kpis.slaPct.target).toBe(95);
    expect(s.statusBreakdown).toHaveLength(6);
    expect(['GREEN', 'AMBER', 'RED']).toContain(s.health.conversion);
    const f = await getJson<S['Funnel']>(app, '/api/dashboard/funnel');
    expect(f.stages.map((x) => x.stage)).toEqual(['START', 'DATA', 'VERIFICATION', 'CUSTOMER_CREATED']);
    const t = await getJson<S['Timeseries']>(app, '/api/dashboard/timeseries');
    expect(t.granularity).toBe('day');
    expect(t.points).toHaveLength(30);
    const r = await getJson<S['Reasons']>(app, '/api/dashboard/reasons');
    expect(r.reasons[0]?.reason).toBe('DOCUMENT_INVALID');
    const l = await getJson<S['ApplicationList']>(app, '/api/applications');
    expect(l.items).toHaveLength(20);
  });

  test('[REQ-001-01] el seed produce KPIs deterministas (30 días, Todos)', async () => {
    const s = await getJson<S['DashboardSummary']>(app, '/api/dashboard/summary');
    expect(s.referenceNow).toBe('2026-10-01T10:00:00.000Z');
    expect(s.kpis).toMatchInlineSnapshot(`
      {
        "applications": {
          "deltaPct": 8.7,
          "previous": 11882,
          "value": 12920,
        },
        "avgDurationSec": {
          "deltaSec": 0,
          "previous": 235,
          "value": 235,
        },
        "conversionPct": {
          "deltaPct": -2,
          "previous": 80.9,
          "value": 78.9,
        },
        "slaPct": {
          "deltaPct": 0.4,
          "previous": 92,
          "target": 95,
          "value": 92.4,
        },
      }
    `);
  });

  test('[AC-001-02] al pasar de Hoy a 7 días se recalculan KPIs, rango, comparativa y gráficos', async () => {
    const today = await getJson<S['DashboardSummary']>(app, `/api/dashboard/summary${q('today', 'ALL')}`);
    const week = await getJson<S['DashboardSummary']>(app, `/api/dashboard/summary${q('7d', 'ALL')}`);
    const dur = (r: S['DateRange']) => Date.parse(r.to) - Date.parse(r.from);
    expect(dur(today.range)).toBe(24 * 3_600_000);
    expect(dur(week.range)).toBe(7 * 24 * 3_600_000);
    expect(dur(week.previousRange)).toBe(dur(week.range));
    expect(week.previousRange.to).toBe(week.range.from);
    expect(week.kpis.applications.value).toBeGreaterThan(today.kpis.applications.value * 5);
    const k = week.kpis.applications;
    expect(k.deltaPct).toBeCloseTo(((k.value - k.previous) / k.previous) * 100, 1);
    expect(week.kpis.conversionPct.deltaPct).toBeCloseTo(
      (week.kpis.conversionPct.value ?? 0) - (week.kpis.conversionPct.previous ?? 0),
      1,
    );
    const tToday = await getJson<S['Timeseries']>(app, `/api/dashboard/timeseries${q('today', 'ALL')}`);
    const tWeek = await getJson<S['Timeseries']>(app, `/api/dashboard/timeseries${q('7d', 'ALL')}`);
    expect(tToday.granularity).toBe('hour');
    expect(tToday.points).toHaveLength(24);
    expect(tWeek.points).toHaveLength(7);
    const fWeek = await getJson<S['Funnel']>(app, `/api/dashboard/funnel${q('7d', 'ALL')}`);
    expect(fWeek.stages[0]?.count).toBe(week.kpis.applications.value);
  });

  test('[AC-001-03] el segmento Partner filtra todos los componentes', async () => {
    const all = await getJson<S['DashboardSummary']>(app, `/api/dashboard/summary${q('30d', 'ALL')}`);
    const totals = await Promise.all(
      ['DIGITAL', 'OFFICE', 'PARTNER'].map((seg) =>
        getJson<S['DashboardSummary']>(app, `/api/dashboard/summary${q('30d', seg)}`),
      ),
    );
    expect(totals.reduce((s, x) => s + x.kpis.applications.value, 0)).toBe(all.kpis.applications.value);
    const partner = totals[2];
    expect(partner?.segment).toBe('PARTNER');
    expect(partner?.kpis.conversionPct.value).toBeLessThan(all.kpis.conversionPct.value ?? 0);
    const list = await getJson<S['ApplicationList']>(app, `/api/applications${q('30d', 'PARTNER')}`);
    expect(list.items.length).toBeGreaterThan(0);
    expect(list.items.every((i) => i.segment === 'PARTNER')).toBe(true);
    const f = await getJson<S['Funnel']>(app, `/api/dashboard/funnel${q('30d', 'PARTNER')}`);
    expect(f.stages[0]?.count).toBe(partner?.kpis.applications.value);
    const t = await getJson<S['Timeseries']>(app, `/api/dashboard/timeseries${q('30d', 'PARTNER')}`);
    const tAll = await getJson<S['Timeseries']>(app, `/api/dashboard/timeseries${q('30d', 'ALL')}`);
    const sum = (x: S['Timeseries']) => x.points.reduce((s, p) => s + p.completed, 0);
    expect(sum(t)).toBeLessThan(sum(tAll) / 5);
    const r = await getJson<S['Reasons']>(app, `/api/dashboard/reasons${q('30d', 'PARTNER')}`);
    const rAll = await getJson<S['Reasons']>(app, `/api/dashboard/reasons${q('30d', 'ALL')}`);
    expect(r.totalIncidents).toBeLessThan(rAll.totalIncidents);
  });

  test('[AC-001-04] el funnel es consistente con los KPIs: Inicio = solicitudes y Cliente creado = completadas', async () => {
    for (const period of ['today', '7d', '30d']) {
      const s = await getJson<S['DashboardSummary']>(app, `/api/dashboard/summary${q(period, 'ALL')}`);
      const f = await getJson<S['Funnel']>(app, `/api/dashboard/funnel${q(period, 'ALL')}`);
      const completed = s.statusBreakdown.find((x) => x.status === 'COMPLETED')?.count;
      expect(f.stages[0]?.count).toBe(s.kpis.applications.value);
      expect(f.stages[3]?.count).toBe(completed);
      expect(f.overallConversionPct).toBe(s.kpis.conversionPct.value);
      const counts = f.stages.map((x) => x.count);
      expect([...counts].sort((a, b) => b - a)).toEqual(counts);
    }
  });

  test('[AC-001-05] CL-10483 (2 min 30 s activa) aparece como próxima a SLA', async () => {
    const l = await getJson<S['ApplicationList']>(app, '/api/applications');
    const row = l.items.find((i) => i.id === 'CL-10483');
    expect(row).toMatchObject({ elapsedSec: 150, slaStatus: 'WARNING', status: 'VERIFYING' });
    const s = await getJson<S['DashboardSummary']>(app, '/api/dashboard/summary');
    expect(s.sla.warningCount).toBeGreaterThanOrEqual(10);
  });

  test('[AC-001-06] CL-10484 (3 min 01 s activa) aparece fuera de SLA', async () => {
    const l = await getJson<S['ApplicationList']>(app, '/api/applications');
    const row = l.items.find((i) => i.id === 'CL-10484');
    expect(row).toMatchObject({ elapsedSec: 181, slaStatus: 'BREACHED' });
    const s = await getJson<S['DashboardSummary']>(app, '/api/dashboard/summary');
    expect(s.sla.breachedCount).toBeGreaterThanOrEqual(10);
    expect(s.sla).toMatchObject({ thresholdSec: 300, activeThresholdSec: 180, warningSec: 120 });
    expect(s.sla.activeWithinPct).toBeCloseTo((s.sla.activeWithinCount / s.sla.activeCount) * 100, 1);
  });

  test('[AC-001-07] el detalle de CL-10481 devuelve su timeline ordenado cronológicamente', async () => {
    const d = await getJson<S['ApplicationDetail']>(app, '/api/applications/CL-10481');
    expect(d.status).toBe('COMPLETED');
    expect(d.events.map((e) => e.type)).toEqual([
      'STARTED',
      'DATA_COMPLETED',
      'DOCUMENT_VALIDATED',
      'IDENTITY_VERIFIED',
      'CUSTOMER_CREATED',
    ]);
    const offsets = d.events.map((e) => e.offsetSec);
    expect([...offsets].sort((a, b) => a - b)).toEqual(offsets);
    expect(offsets[0]).toBe(0);
    expect(d.elapsedSec).toBe(212);
    const res = await app.inject({ method: 'GET', url: '/api/applications/CL-99999' });
    expect(res.statusCode).toBe(404);
    expect(res.headers['content-type']).toContain('application/problem+json');
  });

  test('[AC-001-08] Health muestra alerta ejecutiva cuando el error de verificación crece > 20 %', async () => {
    const s = await getJson<S['DashboardSummary']>(app, '/api/dashboard/summary');
    expect(s.health.verificationError.changePct).toBeGreaterThan(20);
    expect(s.health.alert).toMatch(/^Los errores de verificación han aumentado un \d+ % frente al periodo anterior\.$/);
    const today = await getJson<S['DashboardSummary']>(app, `/api/dashboard/summary${q('today', 'ALL')}`);
    expect(today.health.verificationError.changePct ?? 0).toBeLessThanOrEqual(20);
    expect(today.health.alert).toBeNull();
  });

  test('[AC-001-09] un filtro sin solicitudes devuelve estado vacío sin valores engañosos', async () => {
    const s = await getJson<S['DashboardSummary']>(empty, `/api/dashboard/summary${q('today', 'PARTNER')}`);
    expect(s.isEmpty).toBe(true);
    expect(s.kpis.applications.value).toBe(0);
    expect(s.kpis.conversionPct.value).toBeNull();
    expect(s.kpis.avgDurationSec.value).toBeNull();
    expect(s.kpis.slaPct.value).toBeNull();
    expect(s.health).toMatchObject({ conversion: 'NO_DATA', sla: 'NO_DATA', verification: 'NO_DATA', alert: null });
    const f = await getJson<S['Funnel']>(empty, `/api/dashboard/funnel${q('today', 'PARTNER')}`);
    expect(f.isEmpty).toBe(true);
    expect(f.overallConversionPct).toBeNull();
    const r = await getJson<S['Reasons']>(empty, `/api/dashboard/reasons${q('today', 'PARTNER')}`);
    expect(r.reasons).toEqual([]);
    const l = await getJson<S['ApplicationList']>(empty, `/api/applications${q('today', 'PARTNER')}`);
    expect(l.items).toEqual([]);
  });

  test('[REQ-001-12] las últimas 20 solicitudes se devuelven de la más reciente a la más antigua', async () => {
    const l = await getJson<S['ApplicationList']>(app, '/api/applications');
    const starts = l.items.map((i) => Date.parse(i.startedAt));
    expect([...starts].sort((a, b) => b - a)).toEqual(starts);
    const five = await getJson<S['ApplicationList']>(app, '/api/applications?limit=5');
    expect(five.items).toHaveLength(5);
  });

  test('[REQ-001-08] las causas suman el total de incidencias y vienen ordenadas por volumen', async () => {
    const r = await getJson<S['Reasons']>(app, '/api/dashboard/reasons');
    expect(r.reasons.reduce((s, x) => s + x.count, 0)).toBe(r.totalIncidents);
    const counts = r.reasons.map((x) => x.count);
    expect([...counts].sort((a, b) => b - a)).toEqual(counts);
  });

  test('[REQ-001-07] la distribución por estado suma el total de solicitudes', async () => {
    const s = await getJson<S['DashboardSummary']>(app, '/api/dashboard/summary');
    expect(s.statusBreakdown.reduce((n, x) => n + x.count, 0)).toBe(s.kpis.applications.value);
  });

  test('[REQ-001-06] la serie temporal suma las completadas y rechazadas del periodo', async () => {
    const s = await getJson<S['DashboardSummary']>(app, '/api/dashboard/summary');
    const t = await getJson<S['Timeseries']>(app, '/api/dashboard/timeseries');
    const count = (st: string) => s.statusBreakdown.find((x) => x.status === st)?.count;
    expect(t.points.reduce((n, p) => n + p.completed, 0)).toBe(count('COMPLETED'));
    expect(t.points.reduce((n, p) => n + p.rejected, 0)).toBe(count('REJECTED'));
  });

  test('[REQ-001-16] /api/health informa del estado técnico', async () => {
    const h = await getJson<S['ServiceHealth']>(app, '/api/health');
    expect(h).toMatchObject({ status: 'ok', database: 'ok' });
  });
});
