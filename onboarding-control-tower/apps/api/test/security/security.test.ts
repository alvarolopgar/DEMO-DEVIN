import type { FastifyInstance } from 'fastify';
import { afterAll, beforeAll, describe, expect, test } from 'vitest';
import { createTestApp } from '../helpers.js';
import type { OnboardingRepository } from '../../src/repositories/onboarding-repository.js';

let app: FastifyInstance;
beforeAll(async () => {
  app = await createTestApp();
});
afterAll(async () => app.close());

const LEAK = /(\bat \S+:\d+|node_modules|\.ts:\d+|prisma|sqlite|stack|SELECT )/i;

describe('Seguridad (NFR-001-02, C-001-14)', () => {
  test('[NFR-001-02] filtros inválidos se rechazan con 400 Problem Details', async () => {
    const urls = [
      '/api/dashboard/summary?period=year',
      '/api/dashboard/funnel?segment=RETAIL',
      '/api/dashboard/timeseries?period=7d&period=30d',
      '/api/dashboard/reasons?unknown=1',
      '/api/applications?limit=1000',
      '/api/applications?limit=-1',
      '/api/applications?limit=abc',
    ];
    for (const url of urls) {
      const res = await app.inject({ method: 'GET', url });
      expect(res.statusCode, url).toBe(400);
      expect(res.headers['content-type'], url).toContain('application/problem+json');
      const body = res.json() as { status: number; title: string; type: string };
      expect(body.status).toBe(400);
      expect(body.title).toBeTruthy();
      expect(res.body, url).not.toMatch(LEAK);
    }
  });

  test('[NFR-001-02] intentos de inyección SQL o path traversal no provocan 500 ni filtran datos', async () => {
    const payloads = [
      "/api/applications/CL-10481'%20OR%20'1'='1",
      '/api/applications/CL-10481%3B%20DROP%20TABLE%20OnboardingApplication',
      '/api/applications/..%2F..%2Fetc%2Fpasswd',
      "/api/dashboard/summary?segment=ALL'%20OR%201=1--",
      '/api/dashboard/summary?period=%3Cscript%3Ealert(1)%3C%2Fscript%3E',
    ];
    for (const url of payloads) {
      const res = await app.inject({ method: 'GET', url });
      expect([400, 404], url).toContain(res.statusCode);
      expect(res.body, url).not.toMatch(LEAK);
      expect(res.body, url).not.toContain('<script>');
    }
    const ok = await app.inject({ method: 'GET', url: '/api/applications/CL-10481' });
    expect(ok.statusCode).toBe(200);
  });

  test('[NFR-001-02] un error inesperado devuelve 500 genérico sin stack trace', async () => {
    const failing = new Proxy(
      {},
      { get: () => () => Promise.reject(new Error('SQLITE_CORRUPT at /secret/path/db.ts:42')) },
    ) as OnboardingRepository;
    const broken = await createTestApp({ repository: failing });
    const res = await broken.inject({ method: 'GET', url: '/api/dashboard/summary' });
    await broken.close();
    expect(res.statusCode).toBe(500);
    expect(res.headers['content-type']).toContain('application/problem+json');
    expect(res.json()).toMatchObject({ status: 500, title: 'Internal Server Error' });
    expect(res.body).not.toMatch(LEAK);
    expect(res.body).not.toContain('SQLITE_CORRUPT');
  });

  test('[NFR-001-02] cabeceras de seguridad (Helmet) presentes y sin x-powered-by', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/health' });
    expect(res.headers['x-content-type-options']).toBe('nosniff');
    expect(res.headers['content-security-policy']).toContain("default-src 'self'");
    expect(res.headers['content-security-policy']).toContain("frame-ancestors 'none'");
    expect(res.headers['x-frame-options']).toBeDefined();
    expect(res.headers['referrer-policy']).toBe('no-referrer');
    expect(res.headers['x-powered-by']).toBeUndefined();
  });

  test('[NFR-001-02] CORS solo admite orígenes configurados', async () => {
    const allowed = await app.inject({
      method: 'GET',
      url: '/api/health',
      headers: { origin: 'http://localhost:5173' },
    });
    expect(allowed.headers['access-control-allow-origin']).toBe('http://localhost:5173');
    const denied = await app.inject({ method: 'GET', url: '/api/health', headers: { origin: 'https://evil.example' } });
    expect(denied.headers['access-control-allow-origin']).toBeUndefined();
  });

  test('[NFR-001-02] la API es de solo lectura: métodos de escritura no están disponibles', async () => {
    for (const method of ['POST', 'PUT', 'PATCH', 'DELETE'] as const) {
      const res = await app.inject({ method, url: '/api/applications/CL-10481', payload: {} });
      expect([404, 405], method).toContain(res.statusCode);
      expect(res.headers['content-type']).toContain('application/problem+json');
    }
  });

  test('[NFR-001-02] rutas /api desconocidas devuelven 404 Problem Details', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/admin' });
    expect(res.statusCode).toBe(404);
    expect(res.json()).toMatchObject({ status: 404, title: 'Not Found' });
  });
});
