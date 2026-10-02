# Customer Onboarding Control Tower

Dashboard ejecutivo para entender el rendimiento del onboarding digital (volumen, conversión, tiempos, SLA, estados,
abandono, rechazos y solicitudes atascadas) con **datos 100 % sintéticos y anonimizados**.

Desarrollado con Spec-Driven Development: la fuente de verdad es
[`specs/001-customer-onboarding-control-tower/`](specs/001-customer-onboarding-control-tower/) (spec, clarificaciones,
plan, modelo de datos, contrato OpenAPI, estados UI, tareas y trazabilidad). Antes de cambiar nada, lee
[`.specify/memory/constitution.md`](.specify/memory/constitution.md) y [`AGENTS.md`](AGENTS.md).

## Stack

React 19 · TypeScript 5.9 · Vite 7 · Tailwind CSS 4 · Recharts 3 · TanStack Query 5 — Node.js 22 · Fastify 5 · Prisma 6
· SQLite · Zod 4 · OpenAPI 3.1 — Vitest 4 · React Testing Library · Playwright · ESLint 9 · Prettier 3 · Redocly.

## Puesta en marcha

Requisitos: Node.js 22 y npm 10.

```bash
npm ci                     # instala dependencias y genera Prisma Client
npm run db:reset           # crea SQLite y carga el seed determinista (≈24,8k solicitudes / 60 días)
npm run dev                # API en http://127.0.0.1:3000 + web en http://localhost:5173
```

Modo producción local (API sirve también el frontend compilado en http://127.0.0.1:3000):

```bash
npm start
```

Variables opcionales (`apps/api`): `DATABASE_URL`, `PORT`, `HOST`, `CORS_ORIGINS`, `REFERENCE_NOW` (instante de
referencia; por defecto el `anchor` del seed, 2026-10-01T10:00Z), `SEED`, `SEED_ANCHOR`.

## Calidad y gates

| Comando                | Qué verifica                                                                  |
| ---------------------- | ----------------------------------------------------------------------------- |
| `npm run lint`         | ESLint + Prettier                                                             |
| `npm run typecheck`    | TypeScript estricto (API, web y E2E)                                          |
| `npm run lint:openapi` | Contrato OpenAPI 3.1 (Redocly)                                                |
| `npm test`             | Unit (dominio y seed), API, contrato (Ajv), seguridad, componentes y gate SDD |
| `npm run test:e2e`     | Playwright: AC-001-01..10 contra la app real (seed + base vacía)              |
| `npm run sdd:trace`    | Regenera `traceability.md` a partir de spec, `trace-map.json` y tests         |
| `npm run sdd:check`    | Gate spec-conformance: AC sin test, IDs inexistentes, rutas rotas, trazas     |
| `npm run verify`       | Todo lo anterior                                                              |

## Estructura

```
apps/api      Fastify + Prisma (dominio puro en src/domain, repositorio, servicio, rutas, seed)
apps/web      React + Vite (api/, components/, hooks/, pages/, design/tokens.ts)
specs/001-…   Spec, plan, contrato OpenAPI, trazabilidad
tests/        E2E de aceptación (Playwright)
scripts/sdd   Generador de trazabilidad y gate spec-conformance
```
