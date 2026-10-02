import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import type { z } from 'zod';
import { APP_VERSION } from '../config.js';
import type { OnboardingRepository } from '../repositories/onboarding-repository.js';
import type { DashboardService } from '../services/dashboard-service.js';
import { sendProblem } from '../problem.js';
import { applicationParams, filterQuery, listQuery } from './schemas.js';

function parse<T extends z.ZodType>(
  schema: T,
  input: unknown,
  request: FastifyRequest,
  reply: FastifyReply,
): z.infer<T> | undefined {
  const result = schema.safeParse(input);
  if (result.success) return result.data;
  sendProblem(
    request,
    reply,
    400,
    'Parámetros de consulta no válidos.',
    result.error.issues.map((i) => ({
      field: i.path.join('.') || (i.code === 'unrecognized_keys' ? i.keys.join(',') : ''),
      message: i.message,
    })),
  );
  return undefined;
}

export function registerRoutes(
  app: FastifyInstance,
  deps: { service: DashboardService; repository: OnboardingRepository; now: () => Date },
): void {
  const { service } = deps;
  const dashboard = ['summary', 'funnel', 'timeseries', 'reasons'] as const;

  for (const name of dashboard) {
    app.get(`/api/dashboard/${name}`, async (request, reply) => {
      const q = parse(filterQuery, request.query, request, reply);
      if (!q) return reply;
      return service[name](q.period, q.segment);
    });
  }

  app.get('/api/applications', async (request, reply) => {
    const q = parse(listQuery, request.query, request, reply);
    if (!q) return reply;
    return service.applications(q.period, q.segment, q.limit);
  });

  app.get('/api/applications/:id', async (request, reply) => {
    const p = parse(applicationParams, request.params, request, reply);
    if (!p) return reply;
    const detail = await service.application(p.id);
    if (!detail) return sendProblem(request, reply, 404, 'La solicitud no existe.');
    return detail;
  });

  app.get('/api/health', async () => {
    await deps.repository.ping();
    return { status: 'ok', database: 'ok', referenceNow: deps.now().toISOString(), version: APP_VERSION };
  });
}
