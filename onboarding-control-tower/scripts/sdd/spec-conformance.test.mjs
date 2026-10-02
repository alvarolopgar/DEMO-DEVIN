import assert from 'node:assert/strict';
import { test } from 'node:test';
import { checkConformance, loadRepo, renderTraceability } from './lib.mjs';

const fresh = () => {
  const repo = loadRepo();
  return { ...repo, traceMap: structuredClone(repo.traceMap), testFiles: structuredClone(repo.testFiles) };
};
const withMd = (repo) => ({ ...repo, traceabilityMd: renderTraceability(repo) });

test('[NFR-001-01] el repositorio actual cumple el gate spec-conformance', () => {
  assert.deepEqual(checkConformance(loadRepo()), []);
});

test('[NFR-001-01] detecta un AC sin ningún test que lo cite', () => {
  const repo = fresh();
  for (const f of repo.testFiles) for (const t of f.tests) t.tags = t.tags.filter((id) => id !== 'AC-001-04');
  assert.ok(checkConformance(withMd(repo)).some((e) => e.startsWith('AC-001-04: ningún test')));
});

test('[NFR-001-01] detecta un test que referencia un ID inexistente', () => {
  const repo = fresh();
  repo.testFiles[0].tests.push({ title: '[AC-001-99] fantasma', tags: ['AC-001-99'], cites: ['AC-001-99'] });
  assert.ok(checkConformance(withMd(repo)).some((e) => e.includes('AC-001-99, que no existe')));
});

test('[NFR-001-01] detecta rutas de código inexistentes en trace-map.json', () => {
  const repo = fresh();
  repo.traceMap['BR-001'].code.push('apps/api/src/domain/no-existe.ts');
  assert.ok(checkConformance(withMd(repo)).some((e) => e.includes('no-existe.ts no existe')));
});

test('[NFR-001-01] detecta requisitos o reglas ausentes del trace-map', () => {
  const repo = fresh();
  delete repo.traceMap['REQ-001-12'];
  assert.ok(checkConformance(withMd(repo)).includes('REQ-001-12: falta en trace-map.json'));
});

test('[NFR-001-01] detecta acceptance que no coincide con las líneas REQ de la spec', () => {
  const repo = fresh();
  repo.traceMap['REQ-001-09'].acceptance = ['AC-001-01'];
  assert.ok(checkConformance(withMd(repo)).some((e) => e.startsWith('REQ-001-09: acceptance')));
});

test('[NFR-001-01] detecta un test listado que no cita el requisito ni sus AC', () => {
  const repo = fresh();
  repo.traceMap['BR-005'].tests.push('apps/web/src/design/tokens.test.ts');
  assert.ok(checkConformance(withMd(repo)).some((e) => e.includes('tokens.test.ts no cita BR-005')));
});

test('[NFR-001-01] detecta traceability.md desactualizado', () => {
  const repo = fresh();
  assert.ok(checkConformance({ ...repo, traceabilityMd: '# viejo' }).some((e) => e.includes('desactualizado')));
});
