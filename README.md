# DEMO-DEVIN – Gestión de siniestros de auto

Aplicación de demostración para la gestión de siniestros de auto, desarrollada con **Spec-Driven Development (SDD)**.
La primera historia implementada es **KAN-5 – Crear siniestro auto** (alias Jira DDD-2), especificada en
[`specs/001-crear-siniestro/`](specs/001-crear-siniestro/spec.md).

| Capa | Tecnología | Carpeta |
|---|---|---|
| Backend | .NET 8 Web API, Clean Architecture (API, Application, Domain, Infrastructure) | `backend/` |
| Frontend | Next.js 16, React 19, Fluent UI v9 | `src/` |
| Tests | xUnit (unitarios + contrato OpenAPI), Vitest + Testing Library | `backend/tests/`, `src/**/*.test.ts(x)` |
| Contrato | OpenAPI 3.0 | `specs/<NNN>-<slug>/contracts/openapi.yaml` |
| CI/CD | GitHub Actions: build, test, security (Snyk), spec-conformance, docker, deploy AKS | `.github/workflows/kan-5-ci-cd.yml` |

## Puesta en marcha

Requisitos: .NET SDK 8, Node.js ≥ 22.13, Python 3.10+.

```bash
# Backend (http://localhost:5284, Swagger en /swagger)
cd backend && dotnet run --project src/ClaimsManagement.API

# Frontend (http://localhost:3000/claims/new)
npm ci
NEXT_PUBLIC_API_URL=http://localhost:5284/api npm run dev
```

## Comandos

| Acción | Comando |
|---|---|
| Build y tests backend | `cd backend && dotnet build && dotnet test` |
| Tests de un AC concreto | `cd backend && dotnet test --filter "AC=AC-001-06b"` |
| Lint, tests y build frontend | `npm run lint && npm test && npm run build` |
| Lint del contrato OpenAPI | `npm run lint:openapi` |
| Gate SDD (igual que CI) | `python3 scripts/sdd/check_spec_conformance.py --base origin/<rama-base>` |
| Regenerar trazabilidad | `python3 scripts/sdd/generate_traceability.py` |

## Flujo SDD

La especificación es la fuente de verdad: primero se escribe y acuerda la spec, después los tests que la
demuestran y por último el código. Principios en [`.specify/memory/constitution.md`](.specify/memory/constitution.md);
reglas para agentes (Devin, Copilot…) en [`AGENTS.md`](AGENTS.md).

### Fases

| # | Fase | Salida | Gate |
|---|---|---|---|
| 0 | Constitution | `.specify/memory/constitution.md` | Revisión humana |
| 1 | Specify | `spec.md` (solo QUÉ: `REQ-`, `AC-` en Gherkin, `UI-`, `NFR-` medibles, `EC-`, alcance) | Todo REQ tiene ≥ 1 AC |
| 2 | Clarify | `clarifications.md` (`C-NNN-xx`, decisiones provisionales marcadas) | Sin ambigüedades abiertas sin decisión |
| 3 | Plan | `plan.md`, `data-model.md`, `contracts/openapi.yaml` | Comprobación de la constitución; `npm run lint:openapi` |
| 4 | Design | `ui/states.md` con frames Figma nombrados `UI-NNN-xx <Estado>` | Cada estado UI enlazado a AC |
| 5 | Tasks + Jira | `tasks.md` (`T-NNN-xx` → AC/REQ), historia Jira con AC-IDs | Toda tarea referencia AC/REQ |
| 6 | Tests-first | Tests etiquetados con AC, en rojo | Fallan por el motivo esperado |
| 7 | Implement | Código mínimo hasta verde | `dotnet test`, `npm test` |
| 8 | Analyze/Verify | `traceability.md` regenerado, PR con CI verde | Job `spec-conformance` |

Detalle, prompts de ejemplo y gates: [playbook SDD – Feature](docs/devin/playbook-sdd-feature.md).
Cambios de requisito sobre una spec existente: [playbook SDD – Change Request](docs/devin/playbook-sdd-change-request.md).

### Carpetas

```
.specify/
  memory/constitution.md        Principios no negociables (10 artículos)
  templates/                    spec, clarifications, plan, tasks, traceability
specs/
  001-crear-siniestro/          KAN-5
    spec.md                     QUÉ y POR QUÉ (REQ, AC, UI, NFR, EC, alcance, mapeo de IDs antiguos)
    clarifications.md           Decisiones C-001-xx
    plan.md                     CÓMO (arquitectura, ADR, estrategia de pruebas)
    data-model.md               Claim, ClaimStatus y máquina de estados
    contracts/openapi.yaml      Contrato de la API
    ui/states.md                Estados UI ↔ frames Figma
    tasks.md                    Tareas atómicas T-001-xx
    trace-map.json              REQ → código / Jira; UI → nodo Figma
    traceability.md             GENERADO: REQ → AC → Test → Código → Jira → Figma
scripts/sdd/                    Gate spec-conformance y generador de trazabilidad
docs/devin/                     Playbooks SDD para Devin
```

### Convenciones de trazabilidad

- IDs estables, nunca se reutilizan: `REQ-NNN-xx`, `AC-NNN-xx[a-z]`, `UI-NNN-xx`, `NFR-NNN-xx`, `EC-NNN-xx`, `C-NNN-xx`, `T-NNN-xx`.
- xUnit: `[Trait("AC", "AC-001-06b")]` y `[Trait("REQ", "REQ-001-04")]` en cada test.
- Vitest: el título del test empieza por el AC, p. ej. `it("AC-001-06b: acepta hoy …")`.
- El job `spec-conformance` falla si: un PR cambia `backend/**` o `src/**` sin tocar `specs/`; un AC no tiene test;
  un test cita un AC inexistente; el contrato OpenAPI no pasa el lint; o `traceability.md` no está regenerado.

### Cómo crear la spec 002

1. Crea `specs/002-<slug>/` copiando las plantillas de `.specify/templates/`
   (`spec-template.md` → `spec.md`, etc.) y rellena el front matter (`spec`, `title`, `jira`).
2. Escribe `spec.md` con IDs `REQ-002-xx` y `AC-002-xx` (Gherkin, un `### AC-002-xx – Título` por criterio, con línea `REQ:`).
3. Registra dudas en `clarifications.md` (`C-002-xx`); si no hay respuesta, aplica la opción más conservadora
   marcada como *"Decisión provisional – pendiente de confirmación"*.
4. Redacta `plan.md` (+ `data-model.md`, `contracts/openapi.yaml`, `ui/states.md` si aplica) y `tasks.md`.
5. Crea `trace-map.json` (REQ → código y Jira, UI → nodo Figma) y enlaza la historia de Jira con la spec.
6. Escribe los tests etiquetados con `AC-002-xx`, compruébalos en rojo, implementa y déjalos en verde.
7. Ejecuta `python3 scripts/sdd/generate_traceability.py` y `python3 scripts/sdd/check_spec_conformance.py --base origin/<rama-base>`,
   y abre el PR.

Con Devin: usa el playbook **"SDD – Feature (DEMO-DEVIN)"** indicando la historia de Jira y el número de spec.
