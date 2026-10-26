import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export const API_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
export const WEB_DIST = resolve(API_ROOT, '../web/dist');
export const DEFAULT_DATABASE_URL = `file:${resolve(API_ROOT, 'prisma/dev.db')}`;
export const APP_VERSION = '1.0.0';

export function ensureDatabaseUrl(): string {
  process.env.DATABASE_URL ??= DEFAULT_DATABASE_URL;
  return process.env.DATABASE_URL;
}

export interface ServerConfig {
  host: string;
  port: number;
  corsOrigins: string[];
  /** ADR-04: sobrescribe el instante de referencia de la demo. */
  referenceNow: Date | undefined;
}

export function loadConfig(env: NodeJS.ProcessEnv = process.env): ServerConfig {
  const referenceNow = env.REFERENCE_NOW ? new Date(env.REFERENCE_NOW) : undefined;
  if (referenceNow && Number.isNaN(referenceNow.getTime())) throw new Error('REFERENCE_NOW no es una fecha ISO válida');
  return {
    host: env.HOST ?? '127.0.0.1',
    port: Number(env.PORT ?? 3000),
    corsOrigins: (env.CORS_ORIGINS ?? 'http://localhost:5173,http://127.0.0.1:5173')
      .split(',')
      .map((o) => o.trim())
      .filter(Boolean),
    referenceNow,
  };
}
