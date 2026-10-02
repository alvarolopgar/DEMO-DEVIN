import type { PrismaClient } from '@prisma/client';
import type { Dataset } from './generate.js';

const CHUNK = 5000;

function chunks<T>(items: T[]): T[][] {
  return Array.from({ length: Math.ceil(items.length / CHUNK) }, (_, i) => items.slice(i * CHUNK, (i + 1) * CHUNK));
}

/** Sustituye por completo el dataset sintético. */
export async function persistDataset(prisma: PrismaClient, ds: Dataset): Promise<void> {
  await prisma.$transaction(
    async (tx) => {
      await tx.onboardingEvent.deleteMany();
      await tx.onboardingApplication.deleteMany();
      await tx.datasetMeta.deleteMany();
      for (const data of chunks(ds.applications)) await tx.onboardingApplication.createMany({ data });
      for (const data of chunks(ds.events)) await tx.onboardingEvent.createMany({ data });
      await tx.datasetMeta.create({ data: { id: 1, anchor: ds.anchor, seed: ds.seed } });
    },
    { timeout: 120_000 },
  );
}
