import { PrismaClient } from '@prisma/client';
import { ensureDatabaseUrl } from '../src/config.js';
import { DEFAULT_ANCHOR, DEFAULT_SEED, generateDataset } from '../src/seed/generate.js';
import { persistDataset } from '../src/seed/persist.js';

ensureDatabaseUrl();
const anchor = new Date(process.env.SEED_ANCHOR ?? DEFAULT_ANCHOR);
const seed = Number(process.env.SEED ?? DEFAULT_SEED);
const prisma = new PrismaClient();
const started = Date.now();
const ds = generateDataset({ anchor, seed });
await persistDataset(prisma, ds);
await prisma.$disconnect();
console.log(
  `Seed OK: ${ds.applications.length} solicitudes, ${ds.events.length} eventos, ancla ${anchor.toISOString()}, semilla ${seed} (${Date.now() - started} ms)`,
);
