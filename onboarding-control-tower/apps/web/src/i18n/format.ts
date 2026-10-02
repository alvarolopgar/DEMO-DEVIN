const TZ = 'Europe/Madrid';
const int = new Intl.NumberFormat('es-ES', { maximumFractionDigits: 0, useGrouping: 'always' });
const dec1 = new Intl.NumberFormat('es-ES', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
const signed1 = new Intl.NumberFormat('es-ES', {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
  signDisplay: 'exceptZero',
});
const signedInt = new Intl.NumberFormat('es-ES', { maximumFractionDigits: 0, signDisplay: 'exceptZero' });
const time = new Intl.DateTimeFormat('es-ES', { timeZone: TZ, hour: '2-digit', minute: '2-digit', second: '2-digit' });
const hour = new Intl.DateTimeFormat('es-ES', { timeZone: TZ, hour: '2-digit', minute: '2-digit' });
const day = new Intl.DateTimeFormat('es-ES', { timeZone: TZ, day: 'numeric', month: 'short' });
const dateTime = new Intl.DateTimeFormat('es-ES', { timeZone: TZ, dateStyle: 'long', timeStyle: 'short' });

export const EMPTY = '—';

/** «1.000», «12.920» (agrupa también 4 cifras, como en SPEC-001). */
export const formatInt = (n: number | null) => (n === null ? EMPTY : int.format(n));

export const formatPct = (n: number | null) => (n === null ? EMPTY : `${dec1.format(n)} %`);
export const formatSignedPct = (n: number | null) => (n === null ? EMPTY : `${signed1.format(n)} %`);
export const formatSignedPp = (n: number | null) => (n === null ? EMPTY : `${signed1.format(n)} pp`);
export const formatSignedSec = (n: number | null) => (n === null ? EMPTY : `${signedInt.format(n)} s`);

/** «3 min 55 s». */
export function formatDuration(sec: number | null): string {
  if (sec === null) return EMPTY;
  const m = Math.floor(sec / 60);
  const s = Math.round(sec % 60);
  return m > 0 ? `${m} min ${String(s).padStart(2, '0')} s` : `${s} s`;
}

/** «4:30». */
export function formatClock(sec: number): string {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  const mm = h > 0 ? String(m).padStart(2, '0') : String(m);
  return `${h > 0 ? `${h}:` : ''}${mm}:${String(s).padStart(2, '0')}`;
}

export const formatTime = (iso: string) => time.format(new Date(iso));
export const formatHour = (iso: string) => hour.format(new Date(iso));
export const formatDay = (iso: string) => day.format(new Date(iso)).replace('.', '');
export const formatDateTime = (iso: string) => dateTime.format(new Date(iso));
