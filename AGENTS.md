# AGENTS.md – Reglas para agentes (Devin) y personas

Este repositorio sigue **Spec-Driven Development (SDD)**. Lee primero
[`.specify/memory/constitution.md`](.specify/memory/constitution.md); prevalece sobre este fichero.

## Reglas obligatorias

1. **Spec primero.** No implementes ni cambies comportamiento en `backend/**` o `src/**` sin
   `specs/<NNN>-<slug>/spec.md` **y** `plan.md`. Si no existen, créalos primero con las plantillas de
   `.specify/templates/` y abre un PR de spec.
2. **IDs estables.** Usa los IDs existentes (`REQ-`, `AC-`, `UI-`, `NFR-`, `EC-`, `C-`, `T-`). Nunca renumeres ni reutilices
   un ID; si un requisito se elimina, márcalo como `(retirado)` en la spec.
3. **Test-first.** Para cada cambio de comportamiento: escribe el test con el ID del AC, verifica que falla,
   implementa, verifica que pasa.
   - xUnit: `[Trait("AC", "AC-001-06b")]` + `[Trait("REQ", "REQ-001-04")]`.
   - Vitest: el título del test empieza por el ID (`it("AC-001-06b …")`).
4. **Contract-first.** Toda API en `specs/<NNN>-<slug>/contracts/openapi.yaml`. Si cambias el contrato,
   actualiza también los tests de contrato (`backend/tests/ClaimsManagement.ContractTests`).
5. **Ambigüedades.** No asumas en silencio. Añade una entrada en `clarifications.md` (pregunta, opciones,
   recomendación). Si no puedes esperar respuesta, aplica la opción más conservadora marcada como
   *"Decisión provisional – pendiente de confirmación"* y continúa.
6. **Sin comportamiento fuera de spec.** Lo que no está en `spec.md` no se implementa.
7. **Trazabilidad.** Commits con la clave de la historia (`KAN-5`) y los AC/REQ afectados.
   Regenera `traceability.md` con `python3 scripts/sdd/generate_traceability.py` tras cambiar spec, tareas o tests.
8. **La conversación no es fuente de verdad.** Todo requisito acordado se escribe en `specs/`.

## Estructura

```
.specify/memory/constitution.md   Principios no negociables
.specify/templates/               Plantillas: spec, clarifications, plan, tasks, traceability
specs/<NNN>-<slug>/               Una carpeta por historia (001 = KAN-5)
  spec.md clarifications.md plan.md data-model.md contracts/openapi.yaml
  ui/states.md tasks.md traceability.md (generado)
scripts/sdd/                      Gate de conformidad SDD (CI job spec-conformance)
docs/devin/                       Playbooks SDD para Devin
backend/                          .NET 8 Clean Architecture (API, Application, Domain, Infrastructure, tests)
src/                              Next.js + Fluent UI
```

## Comandos

| Acción | Comando |
|---|---|
| Build backend | `cd backend && dotnet build` |
| Tests backend (unit + contrato) | `cd backend && dotnet test` |
| Tests backend de un AC | `cd backend && dotnet test --filter "AC=AC-001-06b"` |
| Instalar frontend | `npm ci` |
| Lint frontend | `npm run lint` |
| Tests frontend | `npm test` |
| Build frontend | `npm run build` |
| Gate SDD completo (local) | `python3 scripts/sdd/check_spec_conformance.py --base origin/<rama-base>` (o `npm run sdd:check`) |
| Lint del contrato OpenAPI | `npm run lint:openapi` |
| Regenerar trazabilidad | `python3 scripts/sdd/generate_traceability.py` |

Requisitos locales: .NET SDK 8, Node.js ≥ 22.13, Python 3.10+.

## Flujo por fases

Constitution → Specify → Clarify → Plan → Design (Figma) → Tasks + Jira → Tests-first → Implement → Analyze/Verify.
Detalle, entradas/salidas y gates: [`docs/devin/playbook-sdd-feature.md`](docs/devin/playbook-sdd-feature.md).
Cambios de requisito: [`docs/devin/playbook-sdd-change-request.md`](docs/devin/playbook-sdd-change-request.md).
