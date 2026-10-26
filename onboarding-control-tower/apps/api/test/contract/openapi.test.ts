import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { Ajv2020 } from 'ajv/dist/2020.js';
import addFormatsModule from 'ajv-formats';
import type { FastifyInstance } from 'fastify';
import { afterAll, beforeAll, describe, expect, test } from 'vitest';
import { parse } from 'yaml';
import { API_ROOT } from '../../src/config.js';
import { createTestApp, EMPTY_NOW } from '../helpers.js';

interface OpenApiDoc {
  paths: Record<
    string,
    Record<
      string,
      { responses: Record<string, { content?: Record<string, { schema: { $ref?: string } }>; $ref?: string }> }
    >
  >;
  components: { responses: Record<string, { content: Record<string, { schema: { $ref: string } }> }> };
}

const SPEC_PATH = resolve(API_ROOT, '../../specs/001-customer-onboarding-control-tower/contracts/openapi.yaml');
const doc = parse(readFileSync(SPEC_PATH, 'utf8')) as OpenApiDoc;
const addFormats = addFormatsModule as unknown as (ajv: Ajv2020) => Ajv2020;
const ajv = new Ajv2020({ strict: false, allErrors: true });
addFormats(ajv);
ajv.addSchema({ $id: 'oct', components: doc.components });

function schemaRef(path: string, status: string): string {
  const response = doc.paths[path]?.get?.responses[status];
  if (!response) throw new Error(`Sin respuesta ${status} para ${path} en el contrato`);
  const resolved = response.$ref ? doc.components.responses[response.$ref.split('/').pop() ?? ''] : response;
  const content = resolved?.content ?? {};
  const media = content['application/json'] ?? content['application/problem+json'];
  if (!media?.schema.$ref) throw new Error(`Sin schema para ${path} ${status}`);
  return `oct${media.schema.$ref}`;
}

let app: FastifyInstance;
let empty: FastifyInstance;
const routes: string[] = [];

beforeAll(async () => {
  app = await createTestApp({ onRoute: (method, url) => routes.push(`${method} ${url}`) });
  empty = await createTestApp({ referenceNow: EMPTY_NOW });
});
afterAll(async () => {
  await app.close();
  await empty.close();
});

async function expectConforms(server: FastifyInstance, path: string, url: string, status = '200') {
  const res = await server.inject({ method: 'GET', url });
  expect(String(res.statusCode), url).toBe(status);
  const expectedType = status === '200' ? 'application/json' : 'application/problem+json';
  expect(res.headers['content-type'], url).toContain(expectedType);
  const validate = ajv.getSchema(schemaRef(path, status));
  if (!validate) throw new Error(`Schema no compilado: ${path}`);
  const ok = validate(res.json());
  expect(ok, `${url}: ${JSON.stringify(validate.errors)}`).toBe(true);
}

const DASHBOARD = ['summary', 'funnel', 'timeseries', 'reasons'];

describe('Contrato OpenAPI (Art. 3)', () => {
  test('[NFR-001-01] cada operación del contrato está implementada y no hay rutas fuera de contrato', () => {
    const contract = Object.keys(doc.paths).map((p) => `GET ${p.replace(/\{(\w+)\}/g, ':$1')}`);
    const implemented = routes.filter((r) => r.startsWith('GET /api/'));
    expect([...implemented].sort()).toEqual([...contract].sort());
  });

  test('[AC-001-01] las respuestas por defecto cumplen el contrato', async () => {
    for (const p of DASHBOARD) await expectConforms(app, `/api/dashboard/${p}`, `/api/dashboard/${p}`);
    await expectConforms(app, '/api/applications', '/api/applications');
    await expectConforms(app, '/api/applications/{id}', '/api/applications/CL-10481');
    await expectConforms(app, '/api/health', '/api/health');
  });

  test('[AC-001-02] [AC-001-03] todas las combinaciones periodo × segmento cumplen el contrato', async () => {
    for (const period of ['today', '7d', '30d'])
      for (const segment of ['ALL', 'DIGITAL', 'OFFICE', 'PARTNER']) {
        const qs = `?period=${period}&segment=${segment}`;
        for (const p of DASHBOARD) await expectConforms(app, `/api/dashboard/${p}`, `/api/dashboard/${p}${qs}`);
        await expectConforms(app, '/api/applications', `/api/applications${qs}`);
      }
  });

  test('[AC-001-09] las respuestas vacías cumplen el contrato', async () => {
    for (const p of DASHBOARD) await expectConforms(empty, `/api/dashboard/${p}`, `/api/dashboard/${p}?period=today`);
    await expectConforms(empty, '/api/applications', '/api/applications?period=today');
  });

  test('[AC-001-07] los errores 400 y 404 son Problem Details conformes', async () => {
    await expectConforms(app, '/api/dashboard/summary', '/api/dashboard/summary?period=year', '400');
    await expectConforms(app, '/api/applications', '/api/applications?limit=0', '400');
    await expectConforms(app, '/api/applications/{id}', '/api/applications/nope', '400');
    await expectConforms(app, '/api/applications/{id}', '/api/applications/CL-99999', '404');
  });
});
