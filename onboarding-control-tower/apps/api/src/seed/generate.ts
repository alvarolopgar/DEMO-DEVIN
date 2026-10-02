import type { EventType, FunnelStage, Reason, Risk, Segment, Status } from '../domain/types.js';
import { FIXTURES } from './fixtures.js';
import { logNormal, mulberry32, pick } from './random.js';

export const DEFAULT_SEED = 20261001;
/** C-001-02: instante de referencia fijo de la demo (12:00 Europe/Madrid). */
export const DEFAULT_ANCHOR = '2026-10-01T10:00:00.000Z';
export const DATASET_DAYS = 60;
/** Ventana reservada a los fixtures: el histórico termina 30 min antes del ancla. */
const FIXTURE_WINDOW_SEC = 30 * 60;
const EXPIRY_SEC = 30 * 60;
const HOUR_MS = 3_600_000;

export interface SeedApplication {
  id: string;
  segment: Segment;
  status: Status;
  risk: Risk;
  stage: FunnelStage;
  startedAt: Date;
  completedAt: Date | null;
  closedAt: Date | null;
  durationSec: number | null;
  rejectionReason: Reason | null;
}

export interface SeedEvent {
  applicationId: string;
  type: EventType;
  occurredAt: Date;
}

export interface Dataset {
  anchor: Date;
  seed: number;
  applications: SeedApplication[];
  events: SeedEvent[];
}

/** Peso relativo por hora local (Europe/Madrid, UTC+2 en el periodo de la demo). */
const HOURLY_WEIGHT = [
  0.2, 0.12, 0.08, 0.06, 0.06, 0.1, 0.25, 0.5, 0.9, 1.3, 1.5, 1.6, 1.6, 1.5, 1.4, 1.4, 1.5, 1.6, 1.6, 1.5, 1.3, 1.0,
  0.7, 0.4,
];
const HOURLY_TOTAL = HOURLY_WEIGHT.reduce((s, w) => s + w, 0);
const LOCAL_OFFSET_HOURS = 2;

interface SegmentProfile {
  share: number;
  expire: number;
  otherReject: number;
  verificationFactor: number;
  durationFactor: number;
}

/** Partner con peor conversión, más error y mayor duración (SPEC §10). */
const SEGMENTS: Record<Segment, SegmentProfile> = {
  DIGITAL: { share: 0.7, expire: 0.1, otherReject: 0.024, verificationFactor: 0.9, durationFactor: 1 },
  OFFICE: { share: 0.2, expire: 0.11, otherReject: 0.027, verificationFactor: 1, durationFactor: 1.03 },
  PARTNER: { share: 0.1, expire: 0.17, otherReject: 0.05, verificationFactor: 1.8, durationFactor: 1.1 },
};

/** Tasa base (%) de rechazo en verificación: rampa + escalón en la última semana (narrativa REQ-001-17). */
function verificationRejectRate(dayOffset: number): number {
  return dayOffset < DATASET_DAYS - 7 ? 6 + 2.6 * (dayOffset / (DATASET_DAYS - 7)) : 11;
}

function dailyVolume(dayOffset: number, dayOfWeek: number): number {
  const weekend = dayOfWeek === 0 || dayOfWeek === 6;
  return (380 + dayOffset * 1.1) * (weekend ? 0.85 : 1.06);
}

function riskFor(rng: () => number, status: Status, segment: Segment): Risk {
  const shift = segment === 'PARTNER' ? 0.1 : 0;
  if (status === 'COMPLETED')
    return pick(rng, [
      ['LOW', 0.8 - shift],
      ['MEDIUM', 0.17],
      ['HIGH', 0.03 + shift],
    ]);
  if (status === 'REJECTED')
    return pick(rng, [
      ['LOW', 0.1],
      ['MEDIUM', 0.3],
      ['HIGH', 0.6],
    ]);
  return pick(rng, [
    ['LOW', 0.3 - shift],
    ['MEDIUM', 0.5],
    ['HIGH', 0.2 + shift],
  ]);
}

function at(start: Date, offsetSec: number): Date {
  return new Date(start.getTime() + Math.round(offsetSec) * 1000);
}

/** Eventos del timeline coherentes con el estado (REQ-001-15, data-model.md). */
function eventsFor(app: SeedApplication, spanSec: number, rng: () => number): SeedEvent[] {
  const ev = (type: EventType, offsetSec: number): SeedEvent => ({
    applicationId: app.id,
    type,
    occurredAt: at(app.startedAt, offsetSec),
  });
  const list: SeedEvent[] = [ev('STARTED', 0)];
  const reachedData = app.stage !== 'START';
  if (app.status === 'COMPLETED') {
    list.push(
      ev('DATA_COMPLETED', spanSec * 0.35),
      ev('DOCUMENT_VALIDATED', spanSec * 0.62),
      ev('IDENTITY_VERIFIED', spanSec * 0.86),
      ev('CUSTOMER_CREATED', spanSec),
    );
  } else if (app.status === 'EXPIRED') {
    if (reachedData) list.push(ev('DATA_COMPLETED', 60 + rng() * 120));
  } else if (reachedData) {
    list.push(ev('DATA_COMPLETED', spanSec * 0.4));
    const documentValidated =
      app.rejectionReason === 'IDENTITY_FAILED' || (app.status === 'VERIFYING' && Number(app.id.slice(3)) % 2 === 0);
    if (documentValidated) list.push(ev('DOCUMENT_VALIDATED', spanSec * 0.7));
  }
  return list;
}

function backgroundApplication(id: string, startedAt: Date, dayOffset: number, rng: () => number): SeedApplication {
  const segment = pick(
    rng,
    (Object.keys(SEGMENTS) as Segment[]).map((s) => [s, SEGMENTS[s].share] as const),
  );
  const profile = SEGMENTS[segment];
  const base = {
    id,
    segment,
    startedAt,
    completedAt: null,
    rejectionReason: null,
  } satisfies Partial<SeedApplication>;
  const r = rng();
  let status: Status;
  let stage: FunnelStage;
  let reason: Reason | null = null;
  let duration: number;
  if (r < profile.expire) {
    status = 'EXPIRED';
    reason = rng() < 0.5 ? 'ABANDONED' : 'INCOMPLETE';
    stage = reason === 'ABANDONED' && rng() < 0.5 ? 'DATA' : 'START';
    duration = EXPIRY_SEC;
  } else if (r < profile.expire + profile.otherReject) {
    status = 'REJECTED';
    reason = 'OTHER';
    stage = 'DATA';
    duration = logNormal(rng, 120, 0.3);
  } else if (rng() * 100 < verificationRejectRate(dayOffset) * profile.verificationFactor) {
    status = 'REJECTED';
    reason = rng() < 0.88 ? 'DOCUMENT_INVALID' : 'IDENTITY_FAILED';
    stage = 'VERIFICATION';
    duration = logNormal(rng, 170, 0.25);
  } else {
    status = 'COMPLETED';
    stage = 'CUSTOMER_CREATED';
    duration = logNormal(rng, 228 * profile.durationFactor, 0.183);
  }
  const durationSec = Math.max(30, Math.round(duration));
  const closedAt = at(startedAt, durationSec);
  return {
    ...base,
    status,
    stage,
    risk: riskFor(rng, status, segment),
    rejectionReason: reason,
    closedAt,
    completedAt: status === 'COMPLETED' ? closedAt : null,
    durationSec,
  };
}

function stageFor(status: Status, reason: Reason | undefined): FunnelStage {
  switch (status) {
    case 'COMPLETED':
      return 'CUSTOMER_CREATED';
    case 'VERIFYING':
      return 'VERIFICATION';
    case 'DATA_COMPLETED':
      return 'DATA';
    case 'REJECTED':
      return reason === 'OTHER' ? 'DATA' : 'VERIFICATION';
    default:
      return 'START';
  }
}

/** Genera el dataset sintético completo. Función pura: misma semilla y ancla → mismo resultado. */
export function generateDataset({ anchor, seed }: { anchor: Date; seed: number }): Dataset {
  const rng = mulberry32(seed);
  const applications: SeedApplication[] = [];
  const events: SeedEvent[] = [];
  const origin = anchor.getTime() - DATASET_DAYS * 24 * HOUR_MS;
  const historyEnd = anchor.getTime() - FIXTURE_WINDOW_SEC * 1000;
  let sequence = 20001;

  for (let h = 0; h < DATASET_DAYS * 24; h++) {
    const hourStart = origin + h * HOUR_MS;
    const date = new Date(hourStart);
    const localHour = (date.getUTCHours() + LOCAL_OFFSET_HOURS) % 24;
    const dayOffset = h / 24;
    const expected = (dailyVolume(dayOffset, date.getUTCDay()) * (HOURLY_WEIGHT[localHour] ?? 0)) / HOURLY_TOTAL;
    const count = Math.floor(expected + rng());
    const starts = Array.from({ length: count }, () => hourStart + Math.floor((rng() * HOUR_MS) / 1000) * 1000).sort(
      (a, b) => a - b,
    );
    for (const startMs of starts) {
      if (startMs >= historyEnd) continue;
      const app = backgroundApplication(`CL-${sequence++}`, new Date(startMs), dayOffset, rng);
      applications.push(app);
      events.push(...eventsFor(app, app.durationSec ?? 0, rng));
    }
  }

  for (const f of [...FIXTURES].sort((a, b) => b.startedAgoSec - a.startedAgoSec)) {
    const startedAt = at(anchor, -f.startedAgoSec);
    const terminal = f.durationSec !== undefined;
    const closedAt = terminal ? at(startedAt, f.durationSec ?? 0) : null;
    const app: SeedApplication = {
      id: f.id,
      segment: f.segment,
      status: f.status,
      risk: f.risk,
      stage: stageFor(f.status, f.reason),
      startedAt,
      completedAt: f.status === 'COMPLETED' ? closedAt : null,
      closedAt,
      durationSec: f.durationSec ?? null,
      rejectionReason: f.reason ?? null,
    };
    applications.push(app);
    events.push(...eventsFor(app, f.durationSec ?? f.startedAgoSec, rng));
  }

  return { anchor, seed, applications, events };
}
