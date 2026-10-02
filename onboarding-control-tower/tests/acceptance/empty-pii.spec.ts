import { expect, test } from '@playwright/test';
import { EMPTY_BASE_URL, openDashboard } from './helpers';

const PII = [
  { name: 'correo', re: /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/ },
  { name: 'DNI', re: /\b\d{8}[A-HJ-NP-TV-Z]\b/ },
  { name: 'NIE', re: /\b[XYZ]\d{7}[A-HJ-NP-TV-Z]\b/ },
  { name: 'teléfono', re: /(\+34[\s-]?)?\b[6789]\d{2}[\s-]?\d{3}[\s-]?\d{3}\b/ },
];
const PII_KEYS =
  /"(name|nombre|firstName|lastName|apellidos?|email|correo|phone|telefono|dni|nie|document(Number)?)"\s*:/i;

test.describe('Estado vacío y privacidad', () => {
  test('[AC-001-09] [UI-003] sin solicitudes se muestra un estado vacío explícito sin valores engañosos', async ({
    page,
  }) => {
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(e.message));
    await page.goto(`${EMPTY_BASE_URL}/?period=today&segment=PARTNER`);
    await expect(page.getByTestId('empty-state')).toBeVisible();
    await expect(page.getByText('No hay datos para este filtro')).toBeVisible();
    for (const id of ['applications', 'conversion', 'duration', 'sla']) {
      await expect(page.getByTestId(`kpi-${id}-value`)).toHaveText('—');
      await expect(page.getByTestId(`kpi-${id}-delta`)).toHaveText('Sin comparativa');
    }
    await expect(page.locator('main')).not.toContainText(/(?<![\d,])0(,0)? %/);
    await expect(page.getByTestId('applications-table')).toHaveCount(0);
    await expect(page.locator('body')).not.toContainText('NaN');
    await expect(page.locator('body')).not.toContainText('undefined');
    expect(errors).toEqual([]);
  });

  test('[AC-001-09] el estado vacío permite volver a la vista por defecto conservando el control de filtros', async ({
    page,
  }) => {
    await page.goto(`${EMPTY_BASE_URL}/?period=7d&segment=OFFICE`);
    await expect(page.getByTestId('empty-state')).toBeVisible();
    await page.getByRole('button', { name: 'Ver 30 días · Todos' }).click();
    await expect(page).toHaveURL(/period=30d&segment=ALL/);
    await expect(page.getByTestId('empty-state')).toBeVisible();
  });

  test('[AC-001-10] ninguna respuesta del servicio ni la pantalla contienen nombre, DNI/NIE, teléfono o correo', async ({
    page,
  }) => {
    const bodies: string[] = [];
    page.on('response', async (res) => {
      if (res.url().includes('/api/')) bodies.push(await res.text());
    });
    await openDashboard(page);
    await page.getByRole('radio', { name: 'Partner' }).click();
    await expect(page).toHaveURL(/segment=PARTNER/);
    await page.getByTestId('applications-table').locator('tbody tr').first().click();
    await expect(page.getByTestId('timeline-event').first()).toBeVisible();
    await page.waitForLoadState('networkidle');

    expect(bodies.length).toBeGreaterThanOrEqual(10);
    const screen = (await page.locator('body').innerText()) ?? '';
    for (const text of [...bodies, screen]) {
      expect(text).not.toMatch(PII_KEYS);
      for (const { name, re } of PII) expect(re.test(text), `${name} detectado`).toBe(false);
    }
  });
});
