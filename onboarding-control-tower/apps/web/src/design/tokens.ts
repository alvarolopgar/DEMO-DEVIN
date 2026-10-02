/**
 * Design tokens (PLAN §10): fuente única de color. Se exponen como variables CSS `--token-*`
 * (ver `applyTokens`) que Tailwind consume vía `@theme inline` en `index.css`.
 */
export const tokens = {
  color: {
    bg: '#F3F5FA',
    surface: '#FFFFFF',
    border: '#E2E8F0',
    ink: '#0B1B3A',
    muted: '#5B6B86',
    subtle: '#94A3B8',
    primary: '#2563EB',
    'primary-strong': '#1D4ED8',
    'primary-soft': '#E0EAFF',
    ok: '#16A34A',
    'ok-soft': '#DCFCE7',
    'ok-ink': '#166534',
    warn: '#EAB308',
    'warn-soft': '#FEF9C3',
    'warn-ink': '#854D0E',
    danger: '#DC2626',
    'danger-soft': '#FEE2E2',
    'danger-ink': '#991B1B',
    neutral: '#94A3B8',
    'neutral-soft': '#F1F5F9',
    'neutral-ink': '#475569',
  },
} as const;

export type ColorToken = keyof typeof tokens.color;

/** Paleta de series de gráficos (azul para navegación y series base). */
export const chart = {
  completed: tokens.color.ok,
  inProgress: tokens.color.warn,
  rejected: tokens.color.danger,
  expired: tokens.color.neutral,
  primary: tokens.color.primary,
  grid: tokens.color.border,
  axis: tokens.color.muted,
  funnel: ['#1D4ED8', '#2563EB', '#3B82F6', '#16A34A'],
} as const;

export function applyTokens(root: HTMLElement = document.documentElement): void {
  for (const [name, value] of Object.entries(tokens.color)) root.style.setProperty(`--token-${name}`, value);
}
