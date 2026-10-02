import type { FastifyInstance } from 'fastify';
import { afterAll, beforeAll, describe, expect, test } from 'vitest';
import { createTestApp } from '../helpers.js';

let app: FastifyInstance;
beforeAll(async () => {
  app = await createTestApp();
});
afterAll(async () => app.close());

const EMAIL = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i;
const PHONE = /(?:\+34[\s-]?)?\b[6789]\d{2}[\s-]?\d{3}[\s-]?\d{3}\b/;
const DNI = /\b\d{8}[A-HJ-NP-TV-Z]\b/;
const NIE = /\b[XYZ]\d{7}[A-HJ-NP-TV-Z]\b/;
const PII_KEYS =
  /"(name|nombre|firstName|lastName|apellidos?|email|correo|phone|telefono|tel[eé]fono|dni|nie|document(Number)?|address|direccion)"\s*:/i;

describe('Privacidad (REQ-001-20)', () => {
  test('[AC-001-10] ninguna respuesta del servicio contiene nombre, DNI/NIE, teléfono ni correo', async () => {
    const urls = ['/api/health'];
    for (const period of ['today', '7d', '30d'])
      for (const segment of ['ALL', 'DIGITAL', 'OFFICE', 'PARTNER'])
        for (const path of ['summary', 'funnel', 'timeseries', 'reasons'])
          urls.push(`/api/dashboard/${path}?period=${period}&segment=${segment}`);
    urls.push('/api/applications?limit=50');
    const list = await app.inject({ method: 'GET', url: '/api/applications?limit=50' });
    for (const item of (list.json() as { items: { id: string }[] }).items) urls.push(`/api/applications/${item.id}`);
    for (const url of urls) {
      const res = await app.inject({ method: 'GET', url });
      expect(res.statusCode, url).toBe(200);
      for (const re of [EMAIL, PHONE, DNI, NIE, PII_KEYS]) expect(res.body, `${url} ${re}`).not.toMatch(re);
    }
  });

  test('[AC-001-10] los ID de solicitud son anónimos con formato CL-NNNNN', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/applications?limit=50' });
    for (const item of (res.json() as { items: { id: string }[] }).items) expect(item.id).toMatch(/^CL-\d{5}$/);
  });
});
