import type { FastifyInstance } from 'fastify';
import { PrismaClient } from '@prisma/client';
import { buildApp, type AppOptions } from '../src/app.js';

export const prisma = new PrismaClient();

export async function createTestApp(options: Partial<AppOptions> = {}): Promise<FastifyInstance> {
  const app = await buildApp({ prisma, logger: false, corsOrigins: ['http://localhost:5173'], ...options });
  await app.ready();
  return app;
}

export async function getJson<T = Record<string, unknown>>(app: FastifyInstance, url: string): Promise<T> {
  const res = await app.inject({ method: 'GET', url });
  if (res.statusCode !== 200) throw new Error(`${url} → ${res.statusCode}: ${res.body}`);
  return res.json() as T;
}

/** Instante muy posterior al dataset: todos los filtros quedan vacíos (AC-001-09). */
export const EMPTY_NOW = new Date('2030-01-01T00:00:00.000Z');
