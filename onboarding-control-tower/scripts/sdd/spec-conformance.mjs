import { checkConformance, loadRepo } from './lib.mjs';

const repo = loadRepo();
const errors = checkConformance(repo);
if (errors.length > 0) {
  console.error(`spec-conformance: ${errors.length} violación(es)\n`);
  for (const e of errors) console.error(` - ${e}`);
  process.exit(1);
}
const tests = repo.testFiles.reduce((n, f) => n + f.tests.length, 0);
console.log(
  `spec-conformance OK: ${repo.spec.acs.size}/${repo.spec.acs.size} AC cubiertos, ${Object.keys(repo.traceMap).length} entradas en trace-map, ${tests} tests analizados.`,
);
