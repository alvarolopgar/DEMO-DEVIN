import { expect, test } from '@playwright/test';
import { digits, getJson, openDashboard, type FunnelBody, type SummaryKpis } from './helpers';

const KPIS = ['applications', 'conversion', 'duration', 'sla'] as const;

test.describe('Dashboard ejecutivo', () => {
  test('[AC-001-01] la vista inicial muestra KPIs, funnel, evolución, distribución, causas, SLA, Health y últimas 20 solicitudes', async ({
    page,
  }) => {
    await openDashboard(page);
    await expect(page.getByRole('heading', { name: 'Customer Onboarding Control Tower' })).toBeVisible();
    await expect(page.getByRole('radio', { name: '30 días' })).toHaveAttribute('aria-checked', 'true');
    await expect(page.getByRole('radio', { name: 'Todos' })).toHaveAttribute('aria-checked', 'true');
    for (const id of KPIS) await expect(page.getByTestId(`kpi-${id}-value`)).not.toBeEmpty();
    for (const id of ['funnel', 'trend', 'status-donut', 'reasons', 'sla-card', 'health-panel'])
      await expect(page.getByTestId(id)).toBeVisible();
    await expect(page.getByTestId('applications-table').locator('tbody tr')).toHaveCount(20);
    await expect(page.locator('.recharts-surface').first()).toBeVisible();
  });

  test('[AC-001-01] [UI-001] muestra skeleton mientras cargan los datos', async ({ page }) => {
    await page.route('**/api/dashboard/summary**', async (route) => {
      await new Promise((r) => setTimeout(r, 800));
      await route.continue();
    });
    await page.goto('/');
    await expect(page.getByTestId('skeleton').first()).toBeVisible();
    await expect(page.getByTestId('kpi-applications-value')).toBeVisible();
  });

  test('[AC-001-01] [UI-004] un error de API muestra aviso recuperable y Reintentar recupera el dashboard', async ({
    page,
  }) => {
    await page.route('**/api/dashboard/summary**', (route) =>
      route.fulfill({
        status: 500,
        contentType: 'application/problem+json',
        body: JSON.stringify({ type: 'about:blank', title: 'Internal Server Error', status: 500 }),
      }),
    );
    await page.goto('/');
    await expect(page.getByTestId('error-state')).toBeVisible({ timeout: 15_000 });
    await page.unroute('**/api/dashboard/summary**');
    await page.getByRole('button', { name: 'Reintentar' }).click();
    await expect(page.getByTestId('kpi-applications-value')).toBeVisible();
  });

  test('[AC-001-02] al pasar de Hoy a 7 días todos los KPIs y gráficos se recalculan para 7 días', async ({
    page,
    request,
  }) => {
    await openDashboard(page, '?period=today&segment=ALL');
    const today = await getJson<SummaryKpis>(request, '/api/dashboard/summary?period=today&segment=ALL');
    await expect(page.getByTestId('kpi-applications-value')).toHaveText(/\d/);
    expect(digits(await page.getByTestId('kpi-applications-value').textContent())).toBe(
      String(today.kpis.applications.value),
    );

    await page.getByRole('radio', { name: '7 días' }).click();
    await expect(page).toHaveURL(/period=7d/);
    const week = await getJson<SummaryKpis>(request, '/api/dashboard/summary?period=7d&segment=ALL');
    const funnel = await getJson<FunnelBody>(request, '/api/dashboard/funnel?period=7d&segment=ALL');
    await expect(page.getByTestId('kpi-applications-value')).toHaveText(
      new RegExp(String(week.kpis.applications.value).replace(/\B(?=(\d{3})+(?!\d))/g, '\\.')),
    );
    await expect(page.getByTestId('kpi-applications')).toContainText('vs. 7 días anteriores');
    await expect(page.getByTestId('funnel-steps').locator('li').first()).toHaveAttribute(
      'data-count',
      String(funnel.stages[0]?.count),
    );
    expect(week.kpis.applications.value).toBeGreaterThan(today.kpis.applications.value);
  });

  test('[AC-001-03] al seleccionar Partner todos los componentes muestran únicamente datos de Partner', async ({
    page,
    request,
  }) => {
    await openDashboard(page);
    await page.getByRole('radio', { name: 'Partner' }).click();
    await expect(page).toHaveURL(/segment=PARTNER/);
    const partner = await getJson<SummaryKpis>(request, '/api/dashboard/summary?period=30d&segment=PARTNER');
    await expect
      .poll(async () => digits(await page.getByTestId('kpi-applications-value').textContent()))
      .toBe(String(partner.kpis.applications.value));
    const segments = await page.getByTestId('applications-table').locator('tbody tr td:nth-child(2)').allTextContents();
    expect(segments).toHaveLength(20);
    expect(new Set(segments)).toEqual(new Set(['Partner']));
  });

  test('[AC-001-04] el funnel muestra Inicio = iniciadas, Cliente creado = completadas y la conversión final', async ({
    page,
    request,
  }) => {
    await openDashboard(page);
    const funnel = await getJson<FunnelBody>(request, '/api/dashboard/funnel?period=30d&segment=ALL');
    const summary = await getJson<SummaryKpis>(request, '/api/dashboard/summary?period=30d&segment=ALL');
    const steps = page.getByTestId('funnel-steps').locator('li');
    await expect(steps).toHaveCount(4);
    await expect(steps.first()).toHaveAttribute('data-count', String(summary.kpis.applications.value));
    await expect(steps.last()).toHaveAttribute('data-count', String(funnel.stages[3]?.count));
    const counts = (await steps.evaluateAll((els) => els.map((e) => Number(e.getAttribute('data-count'))))) as number[];
    expect([...counts].sort((a, b) => b - a)).toEqual(counts);
    const pct = funnel.overallConversionPct?.toFixed(1).replace('.', ',');
    await expect(page.getByTestId('funnel-conversion')).toHaveText(`${pct} %`);
    await expect(page.getByTestId('kpi-conversion-value')).toHaveText(`${pct} %`);
  });
});
