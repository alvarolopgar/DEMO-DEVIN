# Tareas – 001 Crear siniestro auto (KAN-5)

> Tareas atómicas derivadas de [`plan.md`](plan.md). Test-first: la tarea de test precede a la de implementación del mismo AC.
> Columna **Código**: rutas separadas por `<br>`. La trazabilidad REQ → código que usa `scripts/sdd/generate_traceability.py` está en [`trace-map.json`](trace-map.json).
> Estado: ✔ hecho (PR #3 o este PR) · ☐ pendiente.

| ID | Tarea | Tipo | AC / REQ | Código | Jira | Estado |
|---|---|---|---|---|---|---|
| T-001-01 | Entidad `Claim` con estado inicial Draft e `Id` generado | impl | AC-001-01, AC-001-02, AC-001-03, REQ-001-03, REQ-001-07 | `backend/src/ClaimsManagement.Domain/Entities/Claim.cs`<br>`backend/src/ClaimsManagement.Domain/Enums/ClaimStatus.cs` | DDD-3 | ✔ |
| T-001-02 | Enumeración `ClaimType` | impl | AC-001-08a, REQ-001-06 | `backend/src/ClaimsManagement.Domain/Enums/ClaimType.cs` | DDD-3 | ✔ |
| T-001-03 | Validador de obligatoriedad, CP y fecha, acumulando errores | impl | AC-001-04, AC-001-05, AC-001-06a, AC-001-06e, AC-001-07a, AC-001-07b, AC-001-09, REQ-001-01, REQ-001-02, REQ-001-04, REQ-001-05, REQ-001-08 | `backend/src/ClaimsManagement.Application/Validators/CreateClaimValidator.cs` | DDD-3 | ✔ |
| T-001-04 | Servicio de alta: valida, crea, persiste y mapea la respuesta | impl | AC-001-01, AC-001-10, REQ-001-07, REQ-001-09 | `backend/src/ClaimsManagement.Application/Services/ClaimService.cs`<br>`backend/src/ClaimsManagement.Application/DTOs/CreateClaimRequest.cs`<br>`backend/src/ClaimsManagement.Application/DTOs/ClaimResponse.cs` | DDD-3 | ✔ |
| T-001-05 | Repositorio en memoria | impl | AC-001-11a, AC-001-11b, REQ-001-10 | `backend/src/ClaimsManagement.Infrastructure/Repositories/InMemoryClaimRepository.cs` | DDD-3 | ✔ |
| T-001-06 | Endpoint `POST /api/claims` con 201 y 400 RFC 7807 | impl | AC-001-01, AC-001-16, REQ-001-07, REQ-001-08 | `backend/src/ClaimsManagement.API/Controllers/ClaimsController.cs`<br>`backend/src/ClaimsManagement.API/Program.cs` | DDD-3 | ✔ |
| T-001-07 | Formulario con estados Default/Error/Loading/Success | impl | AC-001-13, AC-001-14, AC-001-15, AC-001-17, REQ-001-12 | `src/components/ClaimForm.tsx`<br>`src/app/claims/new/page.tsx`<br>`src/lib/api.ts`<br>`src/types/claim.ts` | DDD-4 | ✔ |
| T-001-08 | Validación de formulario en frontend | impl | AC-001-04, AC-001-05, AC-001-07a, AC-001-07b, AC-001-09, REQ-001-02, REQ-001-05 | `src/lib/validation.ts` | DDD-4 | ✔ |
| T-001-09 | Etiquetar los 58 tests xUnit existentes con `AC` y `REQ` | test | AC-001-01..AC-001-11b | `backend/tests/ClaimsManagement.Tests` | DDD-5 | ✔ |
| T-001-10 | Tests (rojos) de boundary de fecha Europe/Madrid en backend | test | AC-001-06a, AC-001-06b, AC-001-06c, AC-001-06d, AC-001-06e, REQ-001-04 | `backend/tests/ClaimsManagement.Tests/Application/CreateClaimValidatorTests.cs`<br>`backend/tests/ClaimsManagement.Tests/Helpers/FixedTimeProvider.cs` | DDD-5 | ✔ |
| T-001-11 | "Hoy" en Europe/Madrid en backend (G-04) | impl | AC-001-06a, AC-001-06b, AC-001-06c, AC-001-06d, REQ-001-04 | `backend/src/ClaimsManagement.Application/Common/BusinessDate.cs`<br>`backend/src/ClaimsManagement.Application/Validators/CreateClaimValidator.cs`<br>`backend/src/ClaimsManagement.Application/Services/ClaimService.cs`<br>`backend/src/ClaimsManagement.Infrastructure/DependencyInjection.cs` | DDD-3 | ✔ |
| T-001-12 | Tests (rojos) de tipo fuera de catálogo y fecha no informada en backend | test | AC-001-08b, AC-001-04, REQ-001-06, REQ-001-01 | `backend/tests/ClaimsManagement.Tests/Application/CreateClaimValidatorTests.cs` | DDD-5 | ✔ |
| T-001-13 | Rechazar tipo fuera de catálogo y fecha no informada en backend | impl | AC-001-08b, AC-001-04, REQ-001-06, REQ-001-01 | `backend/src/ClaimsManagement.Application/Validators/CreateClaimValidator.cs` | DDD-3 | ✔ |
| T-001-14 | Tests (rojos) Vitest de `validateClaimForm` y fecha Europe/Madrid en frontend | test | AC-001-04, AC-001-05, AC-001-06a, AC-001-06b, AC-001-06c, AC-001-06d, AC-001-06e, AC-001-07a, AC-001-07b, AC-001-09 | `src/lib/validation.test.ts`<br>`vitest.config.mts`<br>`vitest.setup.ts` | DDD-5 | ✔ |
| T-001-15 | "Hoy" en Europe/Madrid en frontend (G-04) | impl | AC-001-06a, AC-001-06b, AC-001-06c, AC-001-06d, REQ-001-04 | `src/lib/businessDate.ts`<br>`src/lib/validation.ts` | DDD-4 | ✔ |
| T-001-16 | Tests (rojos) de componente y habilitar "Guardar borrador" como alta en Draft (G-05) | test / impl | AC-001-12, AC-001-13, AC-001-14, AC-001-15, AC-001-17, REQ-001-11, REQ-001-12 | `src/components/ClaimForm.test.tsx`<br>`src/components/ClaimForm.tsx` | DDD-4 | ✔ |
| T-001-17 | Contrato OpenAPI y tests de contrato | contract / test | AC-001-01, AC-001-02, AC-001-16, REQ-001-07, REQ-001-08 | `specs/001-crear-siniestro/contracts/openapi.yaml`<br>`backend/tests/ClaimsManagement.Tests/Contract` | DDD-6 | ✔ |
| T-001-18 | Gate CI `spec-conformance` (AC ↔ tests, lint OpenAPI, trazabilidad) | ci | NFR-001-05, NFR-001-07 | `scripts/sdd/check_spec_conformance.py`<br>`scripts/sdd/generate_traceability.py`<br>`specs/001-crear-siniestro/trace-map.json`<br>`redocly.yaml`<br>`.github/workflows/kan-5-ci-cd.yml` | DDD-6 | ✔ |
| T-001-19 | Constitución, AGENTS.md, plantillas y README con flujo SDD | doc | — | `.specify/memory/constitution.md`<br>`AGENTS.md`<br>`README.md` | DDD-6 | ✔ |
| T-001-20 | Actualizar DDD-2 (etiquetas, AC-001-xx, enlace a la spec) | doc | C-001-01 | — | DDD-2 | ✔ |
| T-001-21 | Renombrar frames Figma con UI-ID | doc | UI-001-01..04 | — | DDD-4 | ☐ (API Figma 401) |
| T-001-22 | Confirmar decisiones provisionales C-001-01..12 con negocio | spec | — | `specs/001-crear-siniestro/clarifications.md` | DDD-2 | ☐ |
| T-001-23 | Gate Snyk bloqueante High/Critical con `SNYK_TOKEN` | ci | NFR-001-03 | `.github/workflows/kan-5-ci-cd.yml` | DDD-6 | ☐ |
| T-001-24 | Prueba de carga del alta en preproducción | test | NFR-001-01 | — | DDD-5 | ☐ |
| T-001-25 | Servir los 400 como `application/problem+json` (detectado por el test de contrato) | impl | AC-001-16, NFR-001-02 | `backend/src/ClaimsManagement.API/Controllers/ClaimsController.cs` | DDD-3 | ✔ |
