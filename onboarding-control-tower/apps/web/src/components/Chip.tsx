import type { ReactNode } from 'react';
import type { Risk, SlaStatus, Status } from '../api/types';
import { RISK_TONE, SLA_TONE, STATUS_TONE, type Tone } from '../design/semantics';
import { RISK_LABEL, SLA_LABEL, STATUS_LABEL } from '../i18n/labels';
import { TONE_CHIP, TONE_DOT } from './tone';

export function Chip({ tone, children, title }: { tone: Tone; children: ReactNode; title?: string }) {
  return (
    <span
      data-tone={tone}
      title={title}
      className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset ${TONE_CHIP[tone]}`}
    >
      <span aria-hidden className={`h-1.5 w-1.5 rounded-full ${TONE_DOT[tone]}`} />
      {children}
    </span>
  );
}

export const StatusChip = ({ status }: { status: Status }) => (
  <Chip tone={STATUS_TONE[status]}>{STATUS_LABEL[status]}</Chip>
);
export const SlaChip = ({ status }: { status: SlaStatus }) => <Chip tone={SLA_TONE[status]}>{SLA_LABEL[status]}</Chip>;
export const RiskChip = ({ risk }: { risk: Risk }) => <Chip tone={RISK_TONE[risk]}>{RISK_LABEL[risk]}</Chip>;
