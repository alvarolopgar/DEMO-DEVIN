# Trazabilidad – SPEC-001

> Fichero generado por `npm run sdd:trace` a partir de `spec.md`, `trace-map.json` y los títulos de los tests.
> No editar a mano: el gate `npm run sdd:check` falla si está desactualizado.

## Criterios de aceptación

| AC | Requisitos | Nº tests | Ficheros de test |
| -- | ---------- | -------- | ---------------- |
| AC-001-01 | REQ-001-01, REQ-001-05, REQ-001-06, REQ-001-07, REQ-001-08, REQ-001-09, REQ-001-12, REQ-001-16 | 7 | `apps/api/test/api/dashboard.test.ts`<br>`apps/api/test/contract/openapi.test.ts`<br>`apps/web/src/pages/Dashboard.test.tsx`<br>`tests/acceptance/dashboard.spec.ts` |
| AC-001-02 | REQ-001-02, REQ-001-03 | 4 | `apps/api/test/api/dashboard.test.ts`<br>`apps/api/test/contract/openapi.test.ts`<br>`apps/web/src/pages/Dashboard.test.tsx`<br>`tests/acceptance/dashboard.spec.ts` |
| AC-001-03 | REQ-001-04 | 4 | `apps/api/test/api/dashboard.test.ts`<br>`apps/api/test/contract/openapi.test.ts`<br>`apps/web/src/pages/Dashboard.test.tsx`<br>`tests/acceptance/dashboard.spec.ts` |
| AC-001-04 | REQ-001-05 | 3 | `apps/api/test/api/dashboard.test.ts`<br>`apps/api/test/unit/funnel.test.ts`<br>`tests/acceptance/dashboard.spec.ts` |
| AC-001-05 | REQ-001-09, REQ-001-11, REQ-001-13 | 7 | `apps/api/test/api/dashboard.test.ts`<br>`apps/api/test/unit/seed.test.ts`<br>`apps/api/test/unit/sla.test.ts`<br>`apps/web/src/components/Chip.test.tsx`<br>`apps/web/src/pages/Dashboard.test.tsx`<br>`tests/acceptance/sla-detail.spec.ts` |
| AC-001-06 | REQ-001-09, REQ-001-10, REQ-001-11, REQ-001-13 | 7 | `apps/api/test/api/dashboard.test.ts`<br>`apps/api/test/unit/seed.test.ts`<br>`apps/api/test/unit/sla.test.ts`<br>`apps/web/src/components/Chip.test.tsx`<br>`apps/web/src/pages/Dashboard.test.tsx`<br>`tests/acceptance/sla-detail.spec.ts` |
| AC-001-07 | REQ-001-14, REQ-001-15, REQ-001-18 | 6 | `apps/api/test/api/dashboard.test.ts`<br>`apps/api/test/contract/openapi.test.ts`<br>`apps/api/test/unit/seed.test.ts`<br>`apps/web/src/pages/Dashboard.test.tsx`<br>`tests/acceptance/sla-detail.spec.ts` |
| AC-001-08 | REQ-001-16, REQ-001-17 | 6 | `apps/api/test/api/dashboard.test.ts`<br>`apps/api/test/unit/health.test.ts`<br>`apps/api/test/unit/seed.test.ts`<br>`apps/web/src/pages/Dashboard.test.tsx`<br>`tests/acceptance/sla-detail.spec.ts` |
| AC-001-09 | REQ-001-19 | 6 | `apps/api/test/api/dashboard.test.ts`<br>`apps/api/test/contract/openapi.test.ts`<br>`apps/web/src/components/KpiCard.test.tsx`<br>`apps/web/src/pages/Dashboard.test.tsx`<br>`tests/acceptance/empty-pii.spec.ts` |
| AC-001-10 | REQ-001-20 | 4 | `apps/api/test/api/pii.test.ts`<br>`apps/api/test/unit/seed.test.ts`<br>`tests/acceptance/empty-pii.spec.ts` |

## Requisitos, reglas, estados UI y NFR

| ID | AC | Código | Tests |
| -- | -- | ------ | ----- |
| BR-001 | — | `apps/api/src/domain/metrics.ts`<br>`apps/api/src/services/dashboard-service.ts` | `apps/api/test/unit/metrics.test.ts` |
| BR-002 | — | `apps/api/src/domain/metrics.ts`<br>`apps/api/src/repositories/onboarding-repository.ts` | `apps/api/test/unit/metrics.test.ts` |
| BR-003 | — | `apps/api/src/domain/sla.ts`<br>`apps/api/src/repositories/onboarding-repository.ts` | `apps/api/test/unit/sla.test.ts` |
| BR-004 | — | `apps/api/src/domain/sla.ts`<br>`apps/api/src/domain/constants.ts`<br>`apps/api/src/repositories/onboarding-repository.ts`<br>`apps/api/src/services/dashboard-service.ts`<br>`apps/api/src/seed/fixtures.ts`<br>`apps/web/src/components/SlaCard.tsx` | `apps/api/test/unit/sla.test.ts` |
| BR-005 | — | `apps/api/src/domain/sla.ts`<br>`apps/api/src/domain/constants.ts`<br>`apps/api/src/repositories/onboarding-repository.ts`<br>`apps/api/src/services/dashboard-service.ts`<br>`apps/api/src/seed/fixtures.ts`<br>`apps/web/src/components/SlaCard.tsx` | `apps/api/test/unit/sla.test.ts` |
| BR-006 | — | `apps/api/src/domain/health.ts`<br>`apps/api/src/repositories/onboarding-repository.ts` | `apps/api/test/unit/health.test.ts` |
| BR-007 | — | `apps/api/src/domain/period.ts`<br>`apps/api/src/domain/metrics.ts`<br>`apps/api/src/services/dashboard-service.ts` | `apps/api/test/unit/period.test.ts`<br>`apps/api/test/unit/metrics.test.ts` |
| NFR-001-01 | — | `scripts/sdd/spec-conformance.mjs`<br>`scripts/sdd/lib.mjs` | `scripts/sdd/spec-conformance.test.mjs` |
| NFR-001-02 | — | `apps/api/src/app.ts`<br>`apps/api/src/problem.ts`<br>`apps/api/src/routes/schemas.ts`<br>`../.github/workflows/onboarding-control-tower.yml` | `apps/api/test/security/security.test.ts` |
| REQ-001-01 | AC-001-01 | `apps/api/src/services/dashboard-service.ts`<br>`apps/web/src/pages/Dashboard.tsx`<br>`apps/web/src/components/KpiCard.tsx` | `apps/api/test/api/dashboard.test.ts`<br>`apps/web/src/components/KpiCard.test.tsx`<br>`tests/acceptance/dashboard.spec.ts` |
| REQ-001-02 | AC-001-02 | `apps/api/src/domain/metrics.ts`<br>`apps/api/src/domain/period.ts`<br>`apps/api/src/services/dashboard-service.ts`<br>`apps/web/src/components/KpiCard.tsx` | `apps/api/test/unit/metrics.test.ts`<br>`apps/api/test/api/dashboard.test.ts`<br>`tests/acceptance/dashboard.spec.ts` |
| REQ-001-03 | AC-001-02 | `apps/api/src/domain/period.ts`<br>`apps/web/src/hooks/useDashboardFilters.ts`<br>`apps/web/src/components/FilterGroup.tsx`<br>`apps/web/src/components/DashboardHeader.tsx` | `apps/api/test/unit/period.test.ts`<br>`apps/api/test/api/dashboard.test.ts`<br>`apps/web/src/pages/Dashboard.test.tsx`<br>`tests/acceptance/dashboard.spec.ts` |
| REQ-001-04 | AC-001-03 | `apps/api/src/repositories/onboarding-repository.ts`<br>`apps/api/src/routes/index.ts`<br>`apps/web/src/hooks/useDashboardFilters.ts`<br>`apps/web/src/components/FilterGroup.tsx` | `apps/api/test/api/dashboard.test.ts`<br>`apps/web/src/pages/Dashboard.test.tsx`<br>`tests/acceptance/dashboard.spec.ts` |
| REQ-001-05 | AC-001-01, AC-001-04 | `apps/api/src/domain/funnel.ts`<br>`apps/api/src/services/dashboard-service.ts`<br>`apps/web/src/components/FunnelChart.tsx` | `apps/api/test/unit/funnel.test.ts`<br>`apps/api/test/api/dashboard.test.ts`<br>`tests/acceptance/dashboard.spec.ts` |
| REQ-001-06 | AC-001-01 | `apps/api/src/domain/timeseries.ts`<br>`apps/api/src/services/dashboard-service.ts`<br>`apps/web/src/components/TrendChart.tsx` | `apps/api/test/unit/timeseries.test.ts`<br>`apps/api/test/api/dashboard.test.ts`<br>`tests/acceptance/dashboard.spec.ts` |
| REQ-001-07 | AC-001-01 | `apps/api/src/services/dashboard-service.ts`<br>`apps/web/src/components/StatusDonut.tsx` | `apps/api/test/api/dashboard.test.ts`<br>`tests/acceptance/dashboard.spec.ts` |
| REQ-001-08 | AC-001-01 | `apps/api/src/domain/reasons.ts`<br>`apps/api/src/services/dashboard-service.ts`<br>`apps/web/src/components/ReasonsChart.tsx` | `apps/api/test/unit/reasons.test.ts`<br>`apps/api/test/api/dashboard.test.ts`<br>`tests/acceptance/dashboard.spec.ts` |
| REQ-001-09 | AC-001-01, AC-001-05, AC-001-06 | `apps/api/src/domain/sla.ts`<br>`apps/api/src/repositories/onboarding-repository.ts`<br>`apps/api/src/services/dashboard-service.ts`<br>`apps/web/src/components/SlaCard.tsx` | `apps/api/test/unit/sla.test.ts`<br>`apps/api/test/api/dashboard.test.ts`<br>`tests/acceptance/sla-detail.spec.ts` |
| REQ-001-10 | AC-001-06 | `apps/api/src/domain/constants.ts`<br>`apps/api/src/domain/sla.ts` | `apps/api/test/unit/sla.test.ts`<br>`tests/acceptance/sla-detail.spec.ts` |
| REQ-001-11 | AC-001-05, AC-001-06 | `apps/api/src/domain/sla.ts`<br>`apps/web/src/components/ApplicationsTable.tsx` | `apps/api/test/unit/sla.test.ts`<br>`apps/api/test/api/dashboard.test.ts`<br>`tests/acceptance/sla-detail.spec.ts` |
| REQ-001-12 | AC-001-01 | `apps/api/src/repositories/onboarding-repository.ts`<br>`apps/api/src/routes/index.ts`<br>`apps/web/src/components/ApplicationsTable.tsx` | `apps/api/test/api/dashboard.test.ts`<br>`tests/acceptance/dashboard.spec.ts` |
| REQ-001-13 | AC-001-05, AC-001-06 | `apps/web/src/design/semantics.ts`<br>`apps/web/src/components/Chip.tsx`<br>`apps/web/src/components/tone.ts` | `apps/web/src/components/Chip.test.tsx`<br>`tests/acceptance/sla-detail.spec.ts` |
| REQ-001-14 | AC-001-07 | `apps/web/src/components/ApplicationDrawer.tsx`<br>`apps/api/src/routes/index.ts` | `apps/api/test/api/dashboard.test.ts`<br>`apps/web/src/pages/Dashboard.test.tsx`<br>`tests/acceptance/sla-detail.spec.ts` |
| REQ-001-15 | AC-001-07 | `apps/api/src/repositories/onboarding-repository.ts`<br>`apps/web/src/components/ApplicationDrawer.tsx` | `apps/api/test/api/dashboard.test.ts`<br>`tests/acceptance/sla-detail.spec.ts` |
| REQ-001-16 | AC-001-01, AC-001-08 | `apps/api/src/domain/health.ts`<br>`apps/api/src/services/dashboard-service.ts`<br>`apps/web/src/components/HealthPanel.tsx` | `apps/api/test/unit/health.test.ts`<br>`apps/api/test/api/dashboard.test.ts`<br>`tests/acceptance/dashboard.spec.ts`<br>`tests/acceptance/sla-detail.spec.ts` |
| REQ-001-17 | AC-001-08 | `apps/api/src/domain/health.ts`<br>`apps/api/src/services/dashboard-service.ts`<br>`apps/web/src/components/ExecutiveAlert.tsx` | `apps/api/test/unit/health.test.ts`<br>`apps/api/test/api/dashboard.test.ts`<br>`apps/web/src/pages/Dashboard.test.tsx`<br>`tests/acceptance/sla-detail.spec.ts` |
| REQ-001-18 | AC-001-07 | `apps/web/src/hooks/useDashboardFilters.ts`<br>`apps/web/src/pages/Dashboard.tsx` | `apps/web/src/pages/Dashboard.test.tsx`<br>`tests/acceptance/sla-detail.spec.ts` |
| REQ-001-19 | AC-001-09 | `apps/api/src/services/dashboard-service.ts`<br>`apps/web/src/components/EmptyState.tsx`<br>`apps/web/src/pages/Dashboard.tsx` | `apps/api/test/api/dashboard.test.ts`<br>`apps/web/src/pages/Dashboard.test.tsx`<br>`tests/acceptance/empty-pii.spec.ts` |
| REQ-001-20 | AC-001-10 | `apps/api/src/seed/generate.ts`<br>`apps/api/src/seed/fixtures.ts`<br>`apps/api/prisma/schema.prisma` | `apps/api/test/unit/seed.test.ts`<br>`apps/api/test/api/pii.test.ts`<br>`tests/acceptance/empty-pii.spec.ts` |
| UI-001 | AC-001-01 | `apps/web/src/components/Skeleton.tsx`<br>`apps/web/src/pages/Dashboard.tsx` | `apps/web/src/pages/Dashboard.test.tsx`<br>`tests/acceptance/dashboard.spec.ts` |
| UI-002 | AC-001-01, AC-001-02, AC-001-03 | `apps/web/src/pages/Dashboard.tsx` | `apps/web/src/pages/Dashboard.test.tsx`<br>`tests/acceptance/dashboard.spec.ts` |
| UI-003 | AC-001-09 | `apps/web/src/components/EmptyState.tsx`<br>`apps/web/src/pages/Dashboard.tsx` | `apps/web/src/pages/Dashboard.test.tsx`<br>`tests/acceptance/empty-pii.spec.ts` |
| UI-004 | AC-001-01 | `apps/web/src/components/ErrorState.tsx`<br>`apps/web/src/pages/Dashboard.tsx`<br>`apps/api/src/problem.ts` | `apps/web/src/pages/Dashboard.test.tsx`<br>`tests/acceptance/dashboard.spec.ts` |
| UI-005 | AC-001-07 | `apps/web/src/components/ApplicationDrawer.tsx` | `apps/web/src/pages/Dashboard.test.tsx`<br>`tests/acceptance/sla-detail.spec.ts` |
| UI-006 | AC-001-08 | `apps/web/src/components/ExecutiveAlert.tsx` | `apps/web/src/pages/Dashboard.test.tsx`<br>`tests/acceptance/sla-detail.spec.ts` |

Cobertura de aceptación: 10/10 AC con al menos un test automatizado.
