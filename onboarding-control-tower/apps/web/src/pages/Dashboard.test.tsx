import { act, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, test } from 'vitest';
import { emptySummary, defaultRoutes, mockFetch, summary } from '../test/fixtures';
import { renderWithQuery } from '../test/render';
import { Dashboard } from './Dashboard';

describe('Dashboard (UI-001..UI-006)', () => {
  test('[AC-001-01] muestra Loading (UI-001) y después todos los bloques (UI-002)', async () => {
    mockFetch();
    renderWithQuery(<Dashboard />);
    expect(screen.getAllByTestId('skeleton').length).toBeGreaterThan(0);
    expect(await screen.findByTestId('kpi-applications')).toHaveTextContent('12.920');
    for (const id of [
      'kpi-conversion',
      'kpi-duration',
      'kpi-sla',
      'health-panel',
      'funnel',
      'status-donut',
      'trend',
      'reasons',
      'sla-card',
      'applications-table',
    ])
      expect(screen.getByTestId(id)).toBeInTheDocument();
    expect(screen.getByTestId('kpi-conversion')).toHaveTextContent('78,9 %');
    expect(screen.getByTestId('kpi-duration')).toHaveTextContent('3 min 55 s');
  });

  test('[AC-001-05] [AC-001-06] la tarjeta SLA muestra los umbrales recibidos del backend (C-001-20)', async () => {
    mockFetch();
    renderWithQuery(<Dashboard />);
    const card = await screen.findByTestId('sla-card');
    expect(card).toHaveTextContent('Completadas ≤ 5 min 00 s · activas: próxima > 2 min 00 s, fuera > 3 min 00 s');
  });

  test('[AC-001-08] muestra la alerta ejecutiva (UI-006) y el semáforo Health', async () => {
    mockFetch();
    renderWithQuery(<Dashboard />);
    const alert = await screen.findByTestId('executive-alert');
    expect(alert).toHaveAttribute('role', 'alert');
    expect(alert).toHaveTextContent('Los errores de verificación han aumentado un 27 %');
    expect(screen.getByTestId('health-verification')).toHaveAttribute('data-tone', 'danger');
    expect(screen.getByTestId('health-sla')).toHaveAttribute('data-tone', 'warn');
    expect(screen.getByTestId('health-conversion')).toHaveAttribute('data-tone', 'ok');
  });

  test('[AC-001-08] sin alerta del backend no se muestra el banner', async () => {
    mockFetch({
      ...defaultRoutes,
      '/api/dashboard/summary': { ...summary, health: { ...summary.health, alert: null } },
    });
    renderWithQuery(<Dashboard />);
    await screen.findByTestId('kpi-applications');
    expect(screen.queryByTestId('executive-alert')).not.toBeInTheDocument();
  });

  test('[AC-001-09] filtro sin datos → estado vacío (UI-003) sin valores engañosos', async () => {
    mockFetch({ ...defaultRoutes, '/api/dashboard/summary': emptySummary });
    renderWithQuery(<Dashboard />);
    const empty = await screen.findByTestId('empty-state');
    expect(empty).toHaveTextContent('No hay datos para este filtro');
    expect(screen.getByTestId('kpi-conversion')).toHaveTextContent('—');
    expect(screen.getByTestId('kpi-conversion')).not.toHaveTextContent('0,0 %');
    expect(screen.queryByTestId('applications-table')).not.toBeInTheDocument();
  });

  test('[AC-001-01] error recuperable (UI-004) con Reintentar', async () => {
    let failing = true;
    mockFetch(defaultRoutes, () => (failing ? 500 : 200));
    renderWithQuery(<Dashboard />);
    const error = await screen.findByTestId('error-state');
    expect(error).toHaveAttribute('role', 'alert');
    failing = false;
    await userEvent.click(within(error).getByRole('button', { name: 'Reintentar' }));
    expect(await screen.findByTestId('kpi-applications')).toHaveTextContent('12.920');
  });

  test('[AC-001-02] cambiar el periodo actualiza la URL y vuelve a pedir datos', async () => {
    const calls = mockFetch();
    renderWithQuery(<Dashboard />);
    await screen.findByTestId('kpi-applications');
    await userEvent.click(screen.getByRole('radio', { name: '7 días' }));
    expect(window.location.search).toContain('period=7d');
    await waitFor(() => expect(calls.some((c) => c.includes('/api/dashboard/summary?period=7d'))).toBe(true));
    expect(screen.getByRole('radio', { name: '7 días' })).toHaveAttribute('aria-checked', 'true');
  });

  test('[AC-001-03] cambiar el segmento filtra todas las peticiones', async () => {
    const calls = mockFetch();
    renderWithQuery(<Dashboard />);
    await screen.findByTestId('kpi-applications');
    await userEvent.click(screen.getByRole('radio', { name: 'Partner' }));
    await waitFor(() => {
      for (const p of ['summary', 'funnel', 'timeseries', 'reasons'])
        expect(calls.some((c) => c.startsWith(`/api/dashboard/${p}?`) && c.includes('segment=PARTNER'))).toBe(true);
      expect(calls.some((c) => c.startsWith('/api/applications?') && c.includes('segment=PARTNER'))).toBe(true);
    });
  });

  test('[AC-001-07] seleccionar una fila abre el drawer (UI-005) con timeline y conserva filtros', async () => {
    mockFetch();
    window.history.replaceState(null, '', '/?period=7d&segment=DIGITAL');
    renderWithQuery(<Dashboard />);
    const row = await screen.findByTestId('row-CL-10481');
    await userEvent.click(row);
    const drawer = await screen.findByRole('dialog', { name: /CL-10481/ });
    const items = await within(drawer).findAllByTestId('timeline-event');
    expect(items.map((i) => i.getAttribute('data-type'))).toEqual([
      'STARTED',
      'DATA_COMPLETED',
      'DOCUMENT_VALIDATED',
      'IDENTITY_VERIFIED',
      'CUSTOMER_CREATED',
    ]);
    expect(window.location.search).toContain('period=7d');
    expect(window.location.search).toContain('segment=DIGITAL');
    expect(window.location.search).toContain('app=CL-10481');
    await userEvent.keyboard('{Escape}');
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(window.location.search).not.toContain('app=');
    expect(window.location.search).toContain('period=7d');
  });

  test('[REQ-001-18] el estado de los filtros se restaura desde la URL (navegación atrás)', async () => {
    mockFetch();
    renderWithQuery(<Dashboard />);
    await screen.findByTestId('kpi-applications');
    await userEvent.click(screen.getByRole('radio', { name: 'Hoy' }));
    await act(async () => {
      window.history.back();
      await new Promise((r) => setTimeout(r, 50));
    });
    await waitFor(() => expect(screen.getByRole('radio', { name: '30 días' })).toHaveAttribute('aria-checked', 'true'));
  });
});
