import { existsSync } from 'node:fs';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import fastifyStatic from '@fastify/static';
import type { PrismaClient } from '@prisma/client';
import Fastify, { type FastifyError, type FastifyInstance, type FastifyServerOptions } from 'fastify';
import { sendProblem } from './problem.js';
import { OnboardingRepository } from './repositories/onboarding-repository.js';
import { registerRoutes } from './routes/index.js';
import { DashboardService } from './services/dashboard-service.js';

export interface AppOptions {
  prisma: PrismaClient;
  logger: FastifyServerOptions['logger'];
  corsOrigins: string[];
  /** ADR-04: si no se indica se usa el ancla del dataset. */
  referenceNow?: Date;
  repository?: OnboardingRepository;
  /** Directorio de la SPA compilada (ADR-02). */
  staticDir?: string;
  onRoute?: (method: string, url: string) => void;
}

export async function buildApp(options: AppOptions): Promise<FastifyInstance> {
  const app = Fastify({ logger: options.logger, disableRequestLogging: false, trustProxy: false });
  const repository = options.repository ?? new OnboardingRepository(options.prisma);
  const referenceNow =
    options.referenceNow ?? (options.repository ? new Date() : ((await repository.anchor()) ?? new Date()));
  const now = () => referenceNow;

  if (options.onRoute) {
    const onRoute = options.onRoute;
    app.addHook('onRoute', (r) => {
      for (const m of [r.method].flat()) onRoute(m, r.url);
    });
  }

  await app.register(helmet, {
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", 'data:'],
        connectSrc: ["'self'"],
        fontSrc: ["'self'"],
        objectSrc: ["'none'"],
        frameAncestors: ["'none'"],
        baseUri: ["'self'"],
        formAction: ["'none'"],
        upgradeInsecureRequests: null,
      },
    },
    referrerPolicy: { policy: 'no-referrer' },
  });
  await app.register(cors, { origin: options.corsOrigins, methods: ['GET'] });

  app.setErrorHandler<FastifyError>((error, request, reply) => {
    const status = typeof error.statusCode === 'number' ? error.statusCode : 500;
    if (status >= 400 && status < 500) return sendProblem(request, reply, status, 'Petición no válida.');
    request.log.error({ err: error }, 'Error no controlado');
    return sendProblem(request, reply, 500, 'Se ha producido un error inesperado.');
  });

  const staticDir = options.staticDir;
  const serveSpa = staticDir !== undefined && existsSync(staticDir);
  if (serveSpa) await app.register(fastifyStatic, { root: staticDir, wildcard: false });

  app.setNotFoundHandler((request, reply) => {
    const isApi = request.url.startsWith('/api');
    if (serveSpa && !isApi && request.method === 'GET') return reply.type('text/html').sendFile('index.html');
    return sendProblem(request, reply, 404, 'Recurso no encontrado.');
  });

  registerRoutes(app, { service: new DashboardService(repository, now), repository, now });
  return app;
}
