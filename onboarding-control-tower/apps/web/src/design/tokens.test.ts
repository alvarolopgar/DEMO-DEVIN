import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, test } from 'vitest';
import { tokens } from './tokens';

const COMPONENTS = join(import.meta.dirname, '..', 'components');

describe('Design tokens (PLAN §10)', () => {
  test('[REQ-001-13] la semántica verde/amarillo/rojo/azul/gris existe como token', () => {
    for (const t of ['ok', 'warn', 'danger', 'primary', 'neutral'] as const)
      expect(tokens.color[t]).toMatch(/^#[0-9A-F]{6}$/i);
  });

  test('[REQ-001-13] los componentes no usan literales de color (solo tokens)', () => {
    const files = readdirSync(COMPONENTS).filter((f) => f.endsWith('.tsx') && !f.endsWith('.test.tsx'));
    expect(files.length).toBeGreaterThan(5);
    for (const f of files) {
      const src = readFileSync(join(COMPONENTS, f), 'utf8');
      expect(src, f).not.toMatch(/#[0-9a-f]{3,8}\b|rgba?\(|hsla?\(/i);
      expect(src, f).not.toMatch(
        /\b(?:bg|text|border|fill|stroke)-(?:red|green|yellow|amber|blue|gray|slate|emerald|rose)-\d{2,3}\b/,
      );
    }
  });
});
