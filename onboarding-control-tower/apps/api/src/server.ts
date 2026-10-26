import { PrismaClient } from '@prisma/client';
import { buildApp } from './app.js';
import { ensureDatabaseUrl, loadConfig, WEB_DIST } from './config.js';

ensureDatabaseUrl();
const config = loadConfig();
const prisma = new PrismaClient();
const app = await buildApp({
  prisma,
  logger: { level: process.env.LOG_LEVEL ?? 'info' },
  corsOrigins: config.corsOrigins,
  referenceNow: config.referenceNow,
  staticDir: WEB_DIST,
});

const shutdown = async () => {
  await app.close();
  await prisma.$disconnect();
  process.exit(0);
};
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

await app.listen({ host: config.host, port: config.port });
