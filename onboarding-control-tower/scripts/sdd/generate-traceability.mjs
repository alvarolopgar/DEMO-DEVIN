import { writeFileSync } from 'node:fs';
import { loadRepo, renderTraceability } from './lib.mjs';

const repo = loadRepo();
writeFileSync(repo.mdPath, renderTraceability(repo));
console.log(
  `traceability.md regenerado (${repo.spec.acs.size} AC, ${repo.spec.items.size} requisitos/reglas/estados/NFR).`,
);
