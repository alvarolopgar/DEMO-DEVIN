import type {
  EventType,
  FunnelStage,
  HealthLight,
  Period,
  Reason,
  Risk,
  SegmentFilter,
  SlaStatus,
  Status,
} from '../api/types';

export const PERIOD_LABEL: Record<Period, string> = { today: 'Hoy', '7d': '7 días', '30d': '30 días' };
export const PERIOD_PREVIOUS: Record<Period, string> = {
  today: 'vs. 24 h anteriores',
  '7d': 'vs. 7 días anteriores',
  '30d': 'vs. 30 días anteriores',
};
export const SEGMENT_LABEL: Record<SegmentFilter, string> = {
  ALL: 'Todos',
  DIGITAL: 'Digital',
  OFFICE: 'Oficina',
  PARTNER: 'Partner',
};
export const STATUS_LABEL: Record<Status, string> = {
  STARTED: 'Iniciada',
  DATA_COMPLETED: 'Datos completados',
  VERIFYING: 'Verificando',
  COMPLETED: 'Completada',
  REJECTED: 'Rechazada',
  EXPIRED: 'Caducada',
};
export const SLA_LABEL: Record<SlaStatus, string> = {
  WITHIN: 'En SLA',
  WARNING: 'Próxima a SLA',
  BREACHED: 'Fuera de SLA',
  NOT_EVALUATED: 'No evaluable',
};
export const RISK_LABEL: Record<Risk, string> = { LOW: 'Bajo', MEDIUM: 'Medio', HIGH: 'Alto' };
export const HEALTH_LABEL: Record<HealthLight, string> = {
  GREEN: 'Saludable',
  AMBER: 'Vigilancia',
  RED: 'Alerta',
  NO_DATA: 'Sin datos',
};
export const STAGE_LABEL: Record<FunnelStage, string> = {
  START: 'Inicio',
  DATA: 'Datos',
  VERIFICATION: 'Verificación',
  CUSTOMER_CREATED: 'Cliente creado',
};
export const REASON_LABEL: Record<Reason, string> = {
  DOCUMENT_INVALID: 'Documento inválido',
  IDENTITY_FAILED: 'Identidad no verificada',
  OTHER: 'Otros motivos',
  ABANDONED: 'Abandono del cliente',
  INCOMPLETE: 'Datos incompletos',
};
export const EVENT_LABEL: Record<EventType, string> = {
  STARTED: 'Solicitud iniciada',
  DATA_COMPLETED: 'Datos completados',
  DOCUMENT_VALIDATED: 'Documento validado',
  IDENTITY_VERIFIED: 'Identidad verificada',
  CUSTOMER_CREATED: 'Cliente creado',
};
