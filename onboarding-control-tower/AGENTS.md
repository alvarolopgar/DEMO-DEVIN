# AGENTS.md – Reglas para agentes (Devin) y personas

Este repositorio sigue **Spec-Driven Development**. Lee primero
[`.specify/memory/constitution.md`](.specify/memory/constitution.md); prevalece sobre este fichero.

## Reglas obligatorias

1. **Spec primero**: nada en `apps/**` sin `specs/<NNN>-<slug>/spec.md` + `plan.md`.
2. **IDs estables** (`REQ-`, `BR-`, `AC-`, `UI-`, `NFR-`, `C-`, `T-`); nunca se reutilizan.
3. **Test-first**: test con `[AC-…]` en el título → rojo → implementación → verde.
4. **Contract-first**: cambia `contracts/openapi.yaml`, regenera tipos (`npm run gen:types`) y actualiza tests de contrato.
5. **Ambigüedades** → `clarifications.md` (decisión provisional conservadora si no hay respuesta).
6. **Trazabilidad**: actualiza `trace-map.json` y ejecuta `npm run sdd:trace`; el gate es `npm run sdd:check`.

## Estructura

```
.specify/memory/constitution.md      Principios
specs/001-customer-onboarding-control-tower/
  spec.md clarifications.md plan.md data-model.md
  contracts/openapi.yaml ui/states.md tasks.md
  trace-map.json traceability.md (generado)
apps/api/                            Fastify + Prisma (SQLite) + Zod – reglas de dominio y agregaciones
apps/web/                            React 19 + Vite + Tailwind + Recharts + TanStack Query
tests/acceptance/                    Playwright – un spec por AC
scripts/sdd/                         Gate spec-conformance y generador de trazabilidad
```

## Comandos

| Acción                                         | Comando                                                       |
| ---------------------------------------------- | ------------------------------------------------------------- |
| Instalar + base de datos                       | `npm run setup`                                               |
| Arrancar (un único comando)                    | `npm start` → http://localhost:3000                           |
| Desarrollo con recarga                         | `npm run dev` → http://localhost:5173                         |
| Reset de datos                                 | `npm run db:reset`                                            |
| Lint / tipos                                   | `npm run lint` · `npm run typecheck` · `npm run lint:openapi` |
| Tests unitarios / API+contrato+seguridad / web | `npm run test:unit` · `npm run test:api` · `npm run test:web` |
| E2E (AC)                                       | `npm run test:e2e`                                            |
| Gate SDD                                       | `npm run sdd:check`                                           |
| Todo                                           | `npm run verify`                                              |
