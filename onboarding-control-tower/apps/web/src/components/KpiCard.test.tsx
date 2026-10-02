import { render, screen } from '@testing-library/react';
import { describe, expect, test } from 'vitest';
import { KpiCard } from './KpiCard';

describe('KpiCard (REQ-001-01, REQ-001-02)', () => {
  test('[REQ-001-02] muestra valor, variación y periodo de comparación', () => {
    render(
      <KpiCard
        id="applications"
        label="Solicitudes"
        value="12.920"
        delta="+8,7 %"
        trend="up"
        good="up"
        comparison="vs. 30 días anteriores"
      />,
    );
    const card = screen.getByTestId('kpi-applications');
    expect(card).toHaveTextContent('Solicitudes');
    expect(card).toHaveTextContent('12.920');
    expect(card).toHaveTextContent('+8,7 %');
    expect(card).toHaveTextContent('vs. 30 días anteriores');
    expect(screen.getByTestId('kpi-applications-delta')).toHaveAttribute('data-tone', 'ok');
  });

  test('[REQ-001-02] una variación desfavorable se marca en rojo', () => {
    render(
      <KpiCard
        id="conversion"
        label="Conversión"
        value="78,9 %"
        delta="-2,0 pp"
        trend="down"
        good="up"
        comparison="x"
      />,
    );
    expect(screen.getByTestId('kpi-conversion-delta')).toHaveAttribute('data-tone', 'danger');
  });

  test('[AC-001-09] sin comparativa muestra «Sin comparativa» en lugar de un valor engañoso', () => {
    render(<KpiCard id="sla" label="SLA" value="—" delta={null} trend="flat" good="up" comparison="x" />);
    expect(screen.getByTestId('kpi-sla')).toHaveTextContent('Sin comparativa');
  });
});
