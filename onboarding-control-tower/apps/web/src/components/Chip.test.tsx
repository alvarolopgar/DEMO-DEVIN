import { render, screen } from '@testing-library/react';
import { describe, expect, test } from 'vitest';
import { RiskChip, SlaChip, StatusChip } from './Chip';

describe('Chips de estado (REQ-001-13)', () => {
  test('[REQ-001-13] completada y riesgo bajo en verde', () => {
    render(
      <>
        <StatusChip status="COMPLETED" />
        <RiskChip risk="LOW" />
      </>,
    );
    expect(screen.getByText('Completada')).toHaveAttribute('data-tone', 'ok');
    expect(screen.getByText('Bajo')).toHaveAttribute('data-tone', 'ok');
  });

  test('[AC-001-05] próxima a SLA con tratamiento amarillo', () => {
    render(<SlaChip status="WARNING" />);
    expect(screen.getByText('Próxima a SLA')).toHaveAttribute('data-tone', 'warn');
  });

  test('[AC-001-06] fuera de SLA con tratamiento rojo', () => {
    render(<SlaChip status="BREACHED" />);
    expect(screen.getByText('Fuera de SLA')).toHaveAttribute('data-tone', 'danger');
  });

  test('[REQ-001-13] en curso amarillo, rechazada y riesgo alto en rojo', () => {
    render(
      <>
        <StatusChip status="VERIFYING" />
        <StatusChip status="REJECTED" />
        <RiskChip risk="HIGH" />
      </>,
    );
    expect(screen.getByText('Verificando')).toHaveAttribute('data-tone', 'warn');
    expect(screen.getByText('Rechazada')).toHaveAttribute('data-tone', 'danger');
    expect(screen.getByText('Alto')).toHaveAttribute('data-tone', 'danger');
  });
});
