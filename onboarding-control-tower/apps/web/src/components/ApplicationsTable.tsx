import type { ApplicationList } from '../api/types';
import { formatClock, formatTime } from '../i18n/format';
import { SEGMENT_LABEL } from '../i18n/labels';
import { Card } from './Card';
import { RiskChip, SlaChip, StatusChip } from './Chip';

interface Props {
  list: ApplicationList;
  selectedId: string | null;
  onSelect: (id: string) => void;
}

const HEAD = ['ID', 'Segmento', 'Estado', 'Inicio', 'Tiempo', 'SLA', 'Riesgo'];

/** REQ-001-11 / REQ-001-12: últimas 20 solicitudes. */
export function ApplicationsTable({ list, selectedId, onSelect }: Props) {
  return (
    <Card
      testId="applications-table"
      title="Últimas solicitudes"
      subtitle="Las 20 más recientes del filtro · selecciona una fila para ver el detalle"
      className="col-span-12"
    >
      <div className="overflow-hidden rounded-xl border border-border">
        <table className="w-full table-fixed text-sm">
          <thead className="bg-bg text-left text-xs uppercase tracking-wider text-muted">
            <tr>
              {HEAD.map((h) => (
                <th key={h} scope="col" className="px-4 py-2.5 font-medium">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {list.items.map((row) => (
              <tr
                key={row.id}
                data-testid={`row-${row.id}`}
                data-sla={row.slaStatus}
                tabIndex={0}
                aria-selected={row.id === selectedId}
                onClick={() => onSelect(row.id)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onSelect(row.id);
                  }
                }}
                className="cursor-pointer transition-colors hover:bg-primary-soft/40 focus-visible:bg-primary-soft/60 focus-visible:outline-none aria-selected:bg-primary-soft/60"
              >
                <td className="px-4 py-2.5 font-mono text-[13px] font-semibold text-primary-strong">{row.id}</td>
                <td className="px-4 py-2.5 text-ink">{SEGMENT_LABEL[row.segment]}</td>
                <td className="px-4 py-2.5">
                  <StatusChip status={row.status} />
                </td>
                <td className="tabular px-4 py-2.5 text-muted">{formatTime(row.startedAt)}</td>
                <td className="tabular px-4 py-2.5 font-medium text-ink">{formatClock(row.elapsedSec)}</td>
                <td className="px-4 py-2.5">
                  <SlaChip status={row.slaStatus} />
                </td>
                <td className="px-4 py-2.5">
                  <RiskChip risk={row.risk} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
