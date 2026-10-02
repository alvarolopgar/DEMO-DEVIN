# Tareas – SPEC-001

Orden test-first (Art. 2). Cada tarea referencia los IDs que cubre.

| ID    | Tarea                                                                                            | IDs                                      | Estado |
| ----- | ------------------------------------------------------------------------------------------------ | ---------------------------------------- | ------ |
| T-001 | Constitución, AGENTS.md, spec, clarificaciones, plan, data-model, estados UI                     | todos                                    | ✅     |
| T-002 | Contrato OpenAPI 3.1 + lint Redocly + `gen:types`                                                | REQ-001-01..20                           | ✅     |
| T-003 | Prisma schema SQLite + índices                                                                   | data-model                               | ✅     |
| T-004 | Tests unitarios (rojo) de dominio: SLA, conversión, funnel, health, comparativa, periodos        | BR-001..BR-007, AC-001-04..06, AC-001-08 | ✅     |
| T-005 | Implementación de dominio puro (verde)                                                           | BR-001..BR-007                           | ✅     |
| T-006 | Tests (rojo) del generador de seed: determinismo, proporciones, fixtures, sin PII                | REQ-001-20, PLAN §11                     | ✅     |
| T-007 | Generador determinista + `prisma/seed.ts`                                                        | PLAN §11                                 | ✅     |
| T-008 | Tests API (rojo) con `fastify.inject`, contrato (Ajv) y seguridad                                | AC-001-01..10, NFR-001-02                | ✅     |
| T-009 | Repositorio Prisma, DashboardService, rutas Fastify, Problem Details, Helmet, CORS               | REQ-001-01..20                           | ✅     |
| T-010 | Tests de componentes (rojo): chips, KPI, estados Loading/Empty/Error, drawer                     | UI-001..UI-006                           | ✅     |
| T-011 | Frontend: tokens, layout, KPIs, Health, funnel, donut, tendencia, causas, SLA, tabla, drawer     | REQ-001-01..19                           | ✅     |
| T-012 | Playwright E2E por AC                                                                            | AC-001-01..10                            | ✅     |
| T-013 | `trace-map.json`, `traceability.md`, gate `spec-conformance`                                     | NFR-001-01                               | ✅     |
| T-014 | CI (GitHub Actions): lint, typecheck, OpenAPI, unit/API/contract/security, web, e2e, gate, audit | NFR-001-01, NFR-001-02                   | ✅     |
| T-015 | Publicación en repositorio remoto + PR (pendiente de destino acordado)                           | —                                        | ⏳     |
