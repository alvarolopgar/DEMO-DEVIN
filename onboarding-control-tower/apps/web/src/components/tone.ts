import type { Tone } from '../design/semantics';

export const TONE_CHIP: Record<Tone, string> = {
  ok: 'bg-ok-soft text-ok-ink ring-ok/30',
  warn: 'bg-warn-soft text-warn-ink ring-warn/40',
  danger: 'bg-danger-soft text-danger-ink ring-danger/30',
  neutral: 'bg-neutral-soft text-neutral-ink ring-neutral/30',
  primary: 'bg-primary-soft text-primary-strong ring-primary/30',
};

export const TONE_DOT: Record<Tone, string> = {
  ok: 'bg-ok',
  warn: 'bg-warn',
  danger: 'bg-danger',
  neutral: 'bg-neutral',
  primary: 'bg-primary',
};

export const TONE_TEXT: Record<Tone, string> = {
  ok: 'text-ok-ink',
  warn: 'text-warn-ink',
  danger: 'text-danger-ink',
  neutral: 'text-neutral-ink',
  primary: 'text-primary-strong',
};
