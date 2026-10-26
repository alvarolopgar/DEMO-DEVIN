import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';

export const ROOT = resolve(import.meta.dirname, '../..');
export const SPEC_DIR = 'specs/001-customer-onboarding-control-tower';
export const TEST_ROOTS = ['apps/api/test', 'apps/web/src', 'tests/acceptance', 'scripts/sdd'];
const TEST_FILE = /\.(test|spec)\.(ts|tsx|mjs)$/;
const ID = /\b(REQ-\d{3}-\d{2}|AC-\d{3}-\d{2}|NFR-\d{3}-\d{2}|BR-\d{3}|UI-\d{3})\b/g;
const TAG = /\[(REQ-\d{3}-\d{2}|AC-\d{3}-\d{2}|NFR-\d{3}-\d{2}|BR-\d{3}|UI-\d{3})\]/g;
const TITLE = /\b(?:test|it|describe)(?:\.(?:only|skip|each|todo|describe))?\(\s*(['"`])((?:\\.|(?!\1).)*?)\1/g;

const kindOf = (id) => id.split('-')[0];
const ids = (text, re) => [...text.matchAll(re)].map((m) => m[1]);

/** Extrae REQ/BR/UI/NFR (filas de tabla) y AC (encabezados + línea `REQ:`) de spec.md. */
export function parseSpec(markdown) {
  const items = new Map();
  for (const m of markdown.matchAll(/^\| (REQ-\d{3}-\d{2}|BR-\d{3}|UI-\d{3}|NFR-\d{3}-\d{2}) \|(.*)$/gm)) {
    const cells = m[2].split('|').map((c) => c.trim());
    const acceptance = kindOf(m[1]) === 'UI' ? ids(cells.at(-2) ?? '', /\b(AC-\d{3}-\d{2})\b/g) : [];
    items.set(m[1], { id: m[1], kind: kindOf(m[1]), acceptance });
  }
  const acs = new Map();
  for (const m of markdown.matchAll(/^### (AC-\d{3}-\d{2})[^\n]*\n+REQ: ([^\n]+)/gm)) {
    acs.set(m[1], { id: m[1], reqs: ids(m[2], /\b(REQ-\d{3}-\d{2})\b/g) });
  }
  for (const [id, item] of items) {
    if (item.kind === 'REQ') item.acceptance = [...acs.values()].filter((a) => a.reqs.includes(id)).map((a) => a.id);
  }
  return { items, acs };
}

function walk(dir, out = []) {
  if (!existsSync(dir)) return out;
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    if (e.name === 'node_modules' || e.name === 'generated') continue;
    const p = join(dir, e.name);
    if (e.isDirectory()) walk(p, out);
    else if (TEST_FILE.test(e.name)) out.push(p);
  }
  return out;
}

/** Títulos de test por fichero con los IDs etiquetados `[ID]` y los IDs citados en cualquier forma. */
export function parseTests(source) {
  return [...source.matchAll(TITLE)].map((m) => ({ title: m[2], tags: ids(m[2], TAG), cites: ids(m[2], ID) }));
}

export function scanTests(root = ROOT) {
  return TEST_ROOTS.flatMap((r) => walk(join(root, r)))
    .map((abs) => ({ file: relative(root, abs).split('\\').join('/'), tests: parseTests(readFileSync(abs, 'utf8')) }))
    .sort((a, b) => a.file.localeCompare(b.file));
}

const sorted = (xs) => [...new Set(xs)].sort();
const same = (a, b) => JSON.stringify(sorted(a)) === JSON.stringify(sorted(b));

/** Genera traceability.md de forma determinista a partir de spec, trace-map y tests. */
export function renderTraceability({ spec, traceMap, testFiles }) {
  const tagged = (id) => testFiles.flatMap((f) => f.tests.filter((t) => t.tags.includes(id)).map(() => f.file));
  const lines = [
    '# Trazabilidad – SPEC-001',
    '',
    '> Fichero generado por `npm run sdd:trace` a partir de `spec.md`, `trace-map.json` y los títulos de los tests.',
    '> No editar a mano: el gate `npm run sdd:check` falla si está desactualizado.',
    '',
    '## Criterios de aceptación',
    '',
    '| AC | Requisitos | Nº tests | Ficheros de test |',
    '| -- | ---------- | -------- | ---------------- |',
  ];
  for (const ac of [...spec.acs.values()].sort((a, b) => a.id.localeCompare(b.id))) {
    const files = tagged(ac.id);
    lines.push(
      `| ${ac.id} | ${ac.reqs.join(', ')} | ${files.length} | ${sorted(files)
        .map((f) => `\`${f}\``)
        .join('<br>')} |`,
    );
  }
  lines.push(
    '',
    '## Requisitos, reglas, estados UI y NFR',
    '',
    '| ID | AC | Código | Tests |',
    '| -- | -- | ------ | ----- |',
  );
  for (const id of [...spec.items.keys()].sort()) {
    const e = traceMap[id] ?? { acceptance: [], code: [], tests: [] };
    const fmt = (xs) => xs.map((x) => `\`${x}\``).join('<br>');
    lines.push(`| ${id} | ${e.acceptance.join(', ') || '—'} | ${fmt(e.code)} | ${fmt(e.tests)} |`);
  }
  const total = spec.acs.size;
  const covered = [...spec.acs.keys()].filter((id) => tagged(id).length > 0).length;
  lines.push('', `Cobertura de aceptación: ${covered}/${total} AC con al menos un test automatizado.`, '');
  return lines.join('\n');
}

/**
 * Gate spec-conformance (PLAN-001 §14). Devuelve la lista de violaciones; vacía = conforme.
 * @param {{ spec: ReturnType<typeof parseSpec>, traceMap: Record<string, {acceptance: string[], code: string[], tests: string[]}>,
 *   testFiles: ReturnType<typeof scanTests>, exists: (path: string) => boolean, traceabilityMd: string | null }} input
 */
export function checkConformance({ spec, traceMap, testFiles, exists, traceabilityMd }) {
  const errors = [];
  const known = new Set([...spec.items.keys(), ...spec.acs.keys()]);
  const allTests = testFiles.flatMap((f) => f.tests.map((t) => ({ ...t, file: f.file })));

  for (const ac of spec.acs.keys())
    if (!allTests.some((t) => t.tags.includes(ac)))
      errors.push(`${ac}: ningún test lo cita entre corchetes en su título`);

  for (const t of allTests)
    for (const id of t.cites)
      if (!known.has(id)) errors.push(`${t.file}: el test «${t.title}» referencia ${id}, que no existe en la spec`);

  for (const id of spec.items.keys()) if (!traceMap[id]) errors.push(`${id}: falta en trace-map.json`);

  for (const [id, entry] of Object.entries(traceMap)) {
    const item = spec.items.get(id);
    if (!item) {
      errors.push(`trace-map.json: ${id} no existe en la spec`);
      continue;
    }
    if (!same(entry.acceptance, item.acceptance))
      errors.push(
        `${id}: acceptance [${sorted(entry.acceptance)}] no coincide con la spec [${sorted(item.acceptance)}]`,
      );
    if (entry.code.length === 0) errors.push(`${id}: sin rutas de código`);
    if (entry.tests.length === 0) errors.push(`${id}: sin tests`);
    for (const p of [...entry.code, ...entry.tests]) if (!exists(p)) errors.push(`${id}: la ruta ${p} no existe`);
    for (const p of entry.tests) {
      const file = testFiles.find((f) => f.file === p);
      if (!file) continue;
      const accepted = new Set([id, ...entry.acceptance]);
      if (!file.tests.some((t) => t.cites.some((c) => accepted.has(c))))
        errors.push(`${id}: ${p} no cita ${id} ni ninguno de sus AC en los títulos de sus tests`);
    }
  }

  const expected = renderTraceability({ spec, traceMap, testFiles });
  if (traceabilityMd === null) errors.push('traceability.md no existe (ejecuta npm run sdd:trace)');
  else if (traceabilityMd.replace(/\r\n/g, '\n').trimEnd() !== expected.trimEnd())
    errors.push('traceability.md está desactualizado (ejecuta npm run sdd:trace)');

  return errors;
}

export function loadRepo(root = ROOT) {
  const dir = join(root, SPEC_DIR);
  const mdPath = join(dir, 'traceability.md');
  return {
    spec: parseSpec(readFileSync(join(dir, 'spec.md'), 'utf8')),
    traceMap: JSON.parse(readFileSync(join(dir, 'trace-map.json'), 'utf8')),
    testFiles: scanTests(root),
    exists: (p) => existsSync(join(root, p)),
    traceabilityMd: existsSync(mdPath) ? readFileSync(mdPath, 'utf8') : null,
    mdPath,
  };
}
