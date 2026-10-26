import { execFileSync } from 'node:child_process';
import { resolve } from 'node:path';
import { PrismaClient } from '@prisma/client';
import { API_ROOT } from '../src/config.js';
import { DEFAULT_ANCHOR, DEFAULT_SEED, generateDataset } from '../src/seed/generate.js';
import { persistDataset } from '../src/seed/persist.js';

export default async function setup(): Promise<void> {
  process.env.DATABASE_URL = `file:${resolve(API_ROOT, 'prisma/test.db')}`;
  execFileSync('npx', ['prisma', 'db', 'push', '--force-reset', '--skip-generate'], {
    cwd: API_ROOT,
    stdio: 'ignore',
    env: process.env,
  });
  const prisma = new PrismaClient();
  await persistDataset(prisma, generateDataset({ anchor: new Date(DEFAULT_ANCHOR), seed: DEFAULT_SEED }));
  await prisma.$disconnect();
}
