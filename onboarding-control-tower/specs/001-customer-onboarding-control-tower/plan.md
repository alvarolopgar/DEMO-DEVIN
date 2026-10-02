---
spec: '001'
title: 'Customer Onboarding Control Tower – Plan técnico'
source: 'PLAN-001_Customer_Onboarding_Control_Tower_Especificacion_Tecnica.docx (v1.0)'
---

# PLAN-001 — Customer Onboarding Control Tower

## 1. Objetivo técnico

Implementar SPEC-001 como una aplicación web full-stack local, determinista y visualmente atractiva.

## 2. Stack tecnológico

| Capa            | Tecnología (versión fijada)                                                                                         | Motivo                                                            |
| --------------- | ------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------- |
| Frontend        | React 19.3 + TypeScript 5.9 + Vite 7.3                                                                              | Feedback rápido y separación clara respecto al backend.           |
| UI              | Tailwind CSS 4.3                                                                                                    | UI ejecutiva consistente con bajo coste.                          |
| Gráficos        | Recharts 3.10                                                                                                       | Funnel, líneas, barras y donut responsive.                        |
| Estado servidor | TanStack Query 5                                                                                                    | Cache, loading, error y refetch.                                  |
| Backend         | Node.js 22 + Fastify 5 + TypeScript                                                                                 | API ligera con un único lenguaje extremo a extremo.               |
| Persistencia    | SQLite + Prisma ORM 6.19                                                                                            | Persistencia real sin infraestructura; reset y seed determinista. |
| Contrato        | OpenAPI 3.1 (`contracts/openapi.yaml`) + `openapi-typescript`                                                       | Contrato explícito; tipos generados para API y web.               |
| Validación      | Zod 4                                                                                                               | Filtros y parámetros tipados.                                     |
| Tests           | Vitest 4 (unit, API con `fastify.inject`, contrato con Ajv 2020, seguridad), React Testing Library, Playwright 1.63 | AC ejecutables.                                                   |
| Calidad         | ESLint 9 + typescript-eslint + Prettier, Redocly CLI                                                                | Conformidad automática.                                           |

Versiones fijadas con `--save-exact` y publicadas hace ≥ 7 días (cadena de suministro). `deepmerge-ts` se fuerza
a 8.0.2 vía `overrides` (GHSA-ggr8-5vv4-36mx en la dependencia transitiva de Prisma).

## 3. Arquitectura

```
Browser
  │
  ▼
React + Recharts  (apps/web)  ── TanStack Query, filtros en la URL
  │ REST/JSON (/api/**, mismo origen en `npm start`, proxy Vite en `npm run dev`)
  ▼
Fastify API  (apps/api)
  ├── routes/          validación Zod → DashboardService → DTO del contrato
  ├── services/DashboardService   orquesta periodo actual + anterior
  ├── repositories/OnboardingRepository  (Prisma, agregaciones SQL)
  └── domain/          reglas puras: SLA, conversión, funnel, health, periodos, causas
          │
          ▼
      Prisma ORM ──► SQLite (apps/api/prisma/dev.db)
```

El frontend nunca calcula reglas de negocio críticas: recibe valores agregados y estados (`WITHIN/WARNING/BREACHED`,
`GREEN/AMBER/RED/NO_DATA`) y solo los traduce a etiquetas y design tokens.

## 4. Comprobación de la constitución

| Artículo                 | Cumplimiento                                                                                          |
| ------------------------ | ----------------------------------------------------------------------------------------------------- |
| Art. 1 Spec primero      | `spec.md` + `plan.md` antes de `apps/**`.                                                             |
| Art. 2 Test-first        | Tests etiquetados `[AC-…]` escritos y ejecutados en rojo antes de la implementación (ver `tasks.md`). |
| Art. 3 Contract-first    | `contracts/openapi.yaml` → `npm run gen:types`; test de contrato con Ajv sobre todas las rutas.       |
| Art. 4 Trazabilidad      | `trace-map.json` + `traceability.md` generado + gate `spec-conformance`.                              |
| Art. 5 Reglas en backend | `apps/api/src/domain/**` puras; UI sin umbrales.                                                      |
| Art. 6 Datos sintéticos  | Seed `mulberry32(20261001)`, sin campos de texto libre; test PII.                                     |
| Art. 7 Seguridad         | Zod, Problem Details, Helmet, CORS, suite `test/security`, `npm audit`.                               |

## 5. Modelo de datos

Ver [`data-model.md`](data-model.md). Respecto a PLAN-001 §5 se añaden tres columnas desnormalizadas
(`stage`, `closedAt`, `durationSec`) para resolver funnel, tiempo medio y SLA con agregaciones SQL (PLAN §16).

## 6. API

| Método | Ruta                                          | Uso                                                                      |
| ------ | --------------------------------------------- | ------------------------------------------------------------------------ |
| GET    | `/api/dashboard/summary?period=&segment=`     | KPIs, comparativa, tarjeta SLA, distribución por estado y bloque Health. |
| GET    | `/api/dashboard/funnel?period=&segment=`      | Volumen y conversión por etapa.                                          |
| GET    | `/api/dashboard/timeseries?period=&segment=`  | Series completadas / en curso / rechazadas.                              |
| GET    | `/api/dashboard/reasons?period=&segment=`     | Causas de rechazo/abandono.                                              |
| GET    | `/api/applications?period=&segment=&limit=20` | Últimas solicitudes.                                                     |
| GET    | `/api/applications/:id`                       | Detalle y timeline.                                                      |
| GET    | `/api/health`                                 | Health técnico.                                                          |

`period ∈ {today, 7d, 30d}` (por defecto `30d`), `segment ∈ {ALL, DIGITAL, OFFICE, PARTNER}` (por defecto `ALL`),
`limit ∈ [1, 50]` (por defecto 20). La distribución por estado (REQ-001-07) viaja en `summary.statusBreakdown`
para no añadir un endpoint fuera de PLAN §6 (ADR-03).

## 7. Contrato de respuesta principal

```json
{
  "period": "7d",
  "segment": "ALL",
  "kpis": {
    "applications": { "value": 12480, "previous": 11520, "deltaPct": 8.3 },
    "conversionPct": { "value": 78.4, "previous": 76.3, "deltaPct": 2.1 },
    "avgDurationSec": { "value": 252, "previous": 270, "deltaSec": -18 },
    "slaPct": { "value": 92.0, "previous": 93.1, "deltaPct": -1.1, "target": 95.0 }
  },
  "health": {
    "conversion": "GREEN",
    "sla": "AMBER",
    "verification": "RED",
    "alert": "Los errores de verificación han aumentado un 23 %."
  }
}
```

Contrato completo: [`contracts/openapi.yaml`](contracts/openapi.yaml).

## 8. Reglas técnicas de negocio

| Regla                  | Implementación                                                                                        |
| ---------------------- | ----------------------------------------------------------------------------------------------------- |
| SLA                    | `SLA_THRESHOLD_SECONDS = 300` en `apps/api/src/domain/constants.ts`; la UI recibe `sla.thresholdSec`. |
| Próximo a SLA          | `WARNING_THRESHOLD_SECONDS = 240`.                                                                    |
| Conversión             | `conversionPct()` en `domain/metrics.ts` sobre datos filtrados.                                       |
| Comparativa            | `resolvePeriod()` en `domain/period.ts` devuelve ventana actual y previa de igual duración.           |
| Health                 | Funciones puras `conversionHealth/slaHealth/verificationHealth` (umbrales C-001-06).                  |
| Alerta de verificación | `verificationAlert()` emite si `(actual − previo) / previo > 0,20`.                                   |
| Riesgo inicial         | Dato seed almacenado; sin motor de riesgo en V1.                                                      |

## 9. Diseño de frontend

Rejilla de 12 columnas optimizada para ≥ 1440 px (`max-w-[1600px]`), sin scroll horizontal.

| Zona     | Componente                    | Notas                                                 |
| -------- | ----------------------------- | ----------------------------------------------------- |
| Cabecera | `DashboardHeader`             | Título, selector de periodo y de segmento.            |
| Global   | `ExecutiveAlert`              | Solo visible si `health.alert` no es nulo.            |
| Fila 0   | `HealthPanel`                 | Conversión, SLA y Error de verificación con semáforo. |
| Fila 1   | `KpiCard` × 4                 | Valor grande, delta y microcopy.                      |
| Fila 2   | `FunnelChart` + `StatusDonut` | 7 + 5 columnas.                                       |
| Fila 3   | `TrendChart`                  | Ancho completo.                                       |
| Fila 4   | `ReasonsBarChart` + `SlaCard` | 7 + 5 columnas.                                       |
| Fila 5   | `ApplicationsTable`           | 20 filas máx.; estado, SLA y riesgo con chips.        |
| Overlay  | `ApplicationDrawer`           | Timeline vertical con timestamps.                     |

## 10. Sistema visual

Design tokens en `apps/web/src/design/tokens.ts` (fuente única), expuestos como variables CSS (`--token-*`) y
mapeados a Tailwind con `@theme inline`. Un test impide literales de color en `src/components/**`.

| Semántica         | Uso                                                  |
| ----------------- | ---------------------------------------------------- |
| Verde (`ok`)      | Completada, riesgo bajo, KPI saludable.              |
| Amarillo (`warn`) | En curso, próxima a SLA, KPI en vigilancia.          |
| Rojo (`danger`)   | Rechazada, fuera de SLA, riesgo alto, alerta.        |
| Azul (`primary`)  | Navegación, selección y series base.                 |
| Gris (`neutral`)  | Datos secundarios, ejes, caducadas y deshabilitados. |

Los gráficos incluyen tooltip, leyenda cuando aplica y valor textual complementario (`sr-only` o visible).

## 11. Dataset y semilla determinista

1. ≈ 12.900 solicitudes en 30 días (+ 30 días previos para comparativas).
2. Semilla fija → cada `npm run db:reset` produce exactamente los mismos agregados (anchor + offsets, C-001-02).
3. Digital ~70 %, Oficina ~20 %, Partner ~10 %.
4. Partner con peor conversión y mayor error.
5. ≥ 10 activas entre 4 y 5 min y ≥ 10 por encima de 5 min.
6. Solicitudes con timeline completo y otras rechazadas durante verificación.
7. Sin datos confundibles con PII.

El generador (`apps/api/src/seed/generate.ts`) es una función pura testeada; `prisma/seed.ts` solo persiste.

## 12. Gestión de estado y fetching

- `period`, `segment` y la solicitud abierta (`app`) viven en la URL (`useDashboardFilters`).
- TanStack Query: `queryKey = [recurso, period, segment]`; el drawer usa `['application', id]`.
- Sin Redux ni estado global.

## 13. Testing y trazabilidad SDD

| Nivel       | Herramienta                   | Ubicación                    | Qué valida                                          |
| ----------- | ----------------------------- | ---------------------------- | --------------------------------------------------- |
| Unitario    | Vitest                        | `apps/api/test/unit`         | Reglas SLA, conversión, health, comparativas, seed. |
| API         | Vitest + `fastify.inject`     | `apps/api/test/api`          | Status codes, filtros, shape.                       |
| Contrato    | Ajv 2020 sobre `openapi.yaml` | `apps/api/test/contract`     | Implementación y contrato no divergen.              |
| Seguridad   | Vitest + `fastify.inject`     | `apps/api/test/security`     | NFR-001-02 (C-001-14).                              |
| Componentes | React Testing Library         | `apps/web/src/**/*.test.tsx` | Loading/Empty/Error, chips y semáforos.             |
| E2E / AC    | Playwright                    | `tests/acceptance`           | Filtros, drawer, SLA, alerta, vacío, PII.           |

Cada test incluye el ID entre corchetes al inicio del título: `test('[AC-001-06] …')`.

## 14. trace-map.json

```json
{
  "REQ-001-09": {
    "acceptance": ["AC-001-01", "AC-001-05", "AC-001-06"],
    "code": ["apps/api/src/domain/sla.ts", "apps/web/src/components/SlaCard.tsx"],
    "tests": ["tests/acceptance/sla.spec.ts"]
  }
}
```

El gate (`scripts/sdd/spec-conformance.mjs`) falla si: un AC no tiene test; un test referencia un ID inexistente;
una entrada de `trace-map.json` apunta a un fichero inexistente; un REQ/BR/NFR de la spec no está en el trace-map;
`acceptance` no coincide con las líneas `REQ:` de la spec; un test listado no cita el REQ ni ninguno de sus AC;
o `traceability.md` está desactualizado.

## 15. Manejo de errores

- RFC 7807 Problem Details (`application/problem+json`).
- `period`/`segment`/`limit` inválidos → 400; `id` con formato inválido → 400; `id` inexistente → 404.
- Error inesperado → 500 sin stack trace.
- El frontend presenta un error recuperable con botón Reintentar.

## 16. Rendimiento

- Índices SQLite sobre `startedAt`, `(segment, startedAt)` y `status`.
- Agregaciones en backend (`groupBy`/`aggregate`/SQL); el navegador nunca recibe las filas.
- La tabla devuelve 20 registros por defecto.
- Objetivo p95 < 150 ms por endpoint en local (`apps/api/test/api/performance.test.ts`).

## 17. Decisiones de arquitectura (ADR)

| ADR    | Decisión                                                                      | Motivo                                                                           |
| ------ | ----------------------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| ADR-01 | Monorepo npm workspaces (`apps/api`, `apps/web`).                             | Un único `npm ci` y un único comando de arranque.                                |
| ADR-02 | `npm start` sirve la SPA compilada desde Fastify (mismo origen, puerto 3000). | Arranque con un comando, sin CORS en demo.                                       |
| ADR-03 | `statusBreakdown` dentro de `summary`.                                        | Respeta la lista de endpoints de PLAN §6.                                        |
| ADR-04 | Reloj de demo = `DatasetMeta.anchor` (sobrescribible con `REFERENCE_NOW`).    | Determinismo (C-001-02).                                                         |
| ADR-05 | Prisma 6.19 (no 7.x) y Vitest 4.1.                                            | Versiones estables sin adaptadores obligatorios; sin vulnerabilidades conocidas. |

## 18. Orden de implementación

Ver [`tasks.md`](tasks.md).

## 19. Definición de Done

- La aplicación arranca con un único comando documentado (`npm start`).
- El seed produce datos y KPIs deterministas.
- Todos los endpoints están descritos en OpenAPI.
- 100 % de AC tienen test automatizado.
- `trace-map.json` no contiene referencias rotas.
- Lint, unit, contract y e2e pasan.
- La pantalla de 1440 px muestra el dashboard sin scroll horizontal ni solapes.
- No existe PII real en datos, logs ni capturas.
