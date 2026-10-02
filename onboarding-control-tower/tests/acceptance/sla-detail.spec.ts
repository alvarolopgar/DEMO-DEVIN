import { expect, test } from '@playwright/test';
import { getJson, openDashboard, type ApplicationListBody, type SummaryKpis } from './helpers';

test.describe('SLA, detalle y alerta', () => {
  test('[AC-001-05] una solicitud activa con 4 min 30 s se marca próxima a SLA en amarillo', async ({ page }) => {
    await openDashboard(page);
    const row = page.getByTestId('row-CL-10483');
    await expect(row).toHaveAttribute('data-sla', 'WARNING');
    await expect(row).toContainText('4:30');
    const chip = row.getByText('Próxima a SLA');
    await expect(chip).toHaveAttribute('data-tone', 'warn');
  });

  test('[AC-001-06] una solicitud activa con 5 min 01 s se marca fuera de SLA en rojo', async ({ page, request }) => {
    await openDashboard(page);
    const row = page.getByTestId('row-CL-10484');
    await expect(row).toHaveAttribute('data-sla', 'BREACHED');
    await expect(row).toContainText('5:01');
    await expect(row.getByText('Fuera de SLA')).toHaveAttribute('data-tone', 'danger');
    const summary = await getJson<SummaryKpis>(request, '/api/dashboard/summary?period=30d&segment=ALL');
    await expect(page.getByTestId('sla-breached')).toHaveText(String(summary.sla.breachedCount));
    await expect(page.getByTestId('sla-warning')).toHaveText(String(summary.sla.warningCount));
  });

  test('[AC-001-05] [AC-001-06] las etiquetas SLA de la tabla coinciden con la clasificación del backend', async ({
    page,
    request,
  }) => {
    await openDashboard(page);
    const list = await getJson<ApplicationListBody>(request, '/api/applications?period=30d&segment=ALL&limit=20');
    for (const item of list.items)
      await expect(page.getByTestId(`row-${item.id}`)).toHaveAttribute('data-sla', item.slaStatus);
  });

  test('[AC-001-07] seleccionar CL-10481 abre el panel con su timeline cronológico y conserva los filtros', async ({
    page,
  }) => {
    await openDashboard(page, '?period=7d&segment=ALL');
    await page.getByTestId('row-CL-10481').click();
    const drawer = page.getByRole('dialog', { name: 'CL-10481' });
    await expect(drawer).toBeVisible();
    await expect(page).toHaveURL(/period=7d&segment=ALL&app=CL-10481/);
    const events = drawer.getByTestId('timeline-event');
    await expect(events).toHaveCount(5);
    await expect(events.first()).toContainText('Solicitud iniciada');
    await expect(events.last()).toContainText('Cliente creado');
    const offsets = (await events.evaluateAll((els) => els.map((e) => e.textContent ?? ''))) as string[];
    const secs = offsets.map((t) => {
      const m = /\+(\d+):(\d{2})/.exec(t);
      return m ? Number(m[1]) * 60 + Number(m[2]) : Number.NaN;
    });
    expect([...secs].sort((a, b) => a - b)).toEqual(secs);

    await page.keyboard.press('Escape');
    await expect(drawer).toBeHidden();
    await expect(page).toHaveURL(/period=7d&segment=ALL$/);
    await expect(page.getByRole('radio', { name: '7 días' })).toHaveAttribute('aria-checked', 'true');
  });

  test('[AC-001-07] [REQ-001-18] el detalle es enlazable y Atrás vuelve a la vista con el mismo filtro', async ({
    page,
  }) => {
    await openDashboard(page, '?period=30d&segment=PARTNER');
    const first = page.getByTestId('applications-table').locator('tbody tr').first();
    const id = (await first.getAttribute('data-testid'))?.replace('row-', '') ?? '';
    await first.press('Enter');
    await expect(page.getByRole('dialog', { name: id })).toBeVisible();
    await page.goBack();
    await expect(page.getByRole('dialog')).toBeHidden();
    await expect(page).toHaveURL(/period=30d&segment=PARTNER$/);
    await page.goForward();
    await expect(page.getByRole('dialog', { name: id })).toBeVisible();
    await page.reload();
    await expect(page.getByRole('dialog', { name: id })).toBeVisible();
  });

  test('[AC-001-08] si el error de verificación crece más de un 20 % aparece la alerta ejecutiva', async ({
    page,
    request,
  }) => {
    const summary = await getJson<SummaryKpis>(request, '/api/dashboard/summary?period=30d&segment=ALL');
    expect(summary.health.verificationError.changePct).toBeGreaterThan(20);
    await openDashboard(page);
    const alert = page.getByTestId('executive-alert');
    await expect(alert).toBeVisible();
    await expect(alert).toHaveAttribute('role', 'alert');
    await expect(alert).toContainText(summary.health.alert ?? '');
    await expect(page.getByTestId('health-verification')).toHaveAttribute('data-tone', 'danger');
  });
});
