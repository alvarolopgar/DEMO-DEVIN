/**
 * Uso: tsx scripts/db.ts reset | ensure | empty
 *  - reset: recrea el esquema SQLite y ejecuta el seed determinista.
 *  - ensure: solo hace reset si la base de datos no existe o está vacía.
 *  - empty: recrea el esquema sin datos (escenario E2E de estado vacío, AC-001-09).
 */
import { execFileSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { PrismaClient } from '@prisma/client';
import { API_ROOT, ensureDatabaseUrl } from '../src/config.js';

const url = ensureDatabaseUrl();
const run = (args: string[]) => execFileSync('npx', args, { cwd: API_ROOT, stdio: 'inherit', env: process.env });

function reset(): void {
  run(['prisma', 'db', 'push', '--force-reset', '--skip-generate']);
  run(['tsx', 'prisma/seed.ts']);
}

async function isSeeded(): Promise<boolean> {
  if (url.startsWith('file:') && !existsSync(url.startsWith('file:/') ? fileURLToPath(new URL(url)) : url.slice(5)))
    return false;
  const prisma = new PrismaClient();
  try {
    return (await prisma.datasetMeta.count()) > 0;
  } catch {
    return false;
  } finally {
    await prisma.$disconnect();
  }
}

const mode = process.argv[2];
if (mode === 'reset') reset();
else if (mode === 'empty') run(['prisma', 'db', 'push', '--force-reset', '--skip-generate']);
else if (mode === 'ensure') {
  if (await isSeeded()) console.log('Base de datos lista.');
  else reset();
} else {
  console.error('Uso: tsx scripts/db.ts reset | ensure | empty');
  process.exit(1);
}
