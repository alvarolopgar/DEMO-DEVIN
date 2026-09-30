# Tareas – 002 Alta digital de cliente (SPEC-002)

> Tareas atómicas derivadas de [`plan.md`](plan.md). Test-first: la tarea de test precede a la de
> implementación del mismo AC.
> Columna **Código**: rutas previstas (la spec se entrega antes de implementar). La trazabilidad
> REQ → código que usa `scripts/sdd/generate_traceability.py` está en [`trace-map.json`](trace-map.json).
> Estado: ✔ hecho · ☐ pendiente.

| ID | Tarea | Tipo | AC / REQ | Código | Jira | Estado |
|---|---|---|---|---|---|---|
| T-002-01 | Spec de la historia (REQ, AC, UI, NFR, EC) | spec | REQ-002-01..17, AC-002-01..22 | `specs/002-alta-digital-cliente/spec.md` | — | ✔ |
| T-002-02 | Clarificaciones y decisiones provisionales | spec | C-002-01..10 | `specs/002-alta-digital-cliente/clarifications.md` | — | ✔ |
| T-002-03 | Plan técnico, modelo de datos y máquina de estados | doc | — | `specs/002-alta-digital-cliente/plan.md`<br>`specs/002-alta-digital-cliente/data-model.md` | — | ✔ |
| T-002-04 | Contrato OpenAPI del alta | contract | AC-002-01, AC-002-17a, AC-002-18, REQ-002-12, REQ-002-16 | `specs/002-alta-digital-cliente/contracts/openapi.yaml` | — | ✔ |
| T-002-05 | Estados UI e identidad gráfica Banco Sabadell | doc | UI-002-01..05, NFR-002-04, NFR-002-09 | `specs/002-alta-digital-cliente/ui/states.md`<br>`specs/002-alta-digital-cliente/ui/brand.md` | — | ✔ |
| T-002-06 | Eximir del check AC↔test a specs sin implementación en el gate | ci | C-002-10, NFR-002-07 | `scripts/sdd/check_spec_conformance.py` | — | ✔ |
| T-002-07 | `trace-map.json` y `traceability.md` generado | spec | — | `specs/002-alta-digital-cliente/trace-map.json`<br>`specs/002-alta-digital-cliente/traceability.md` | — | ✔ |
| T-002-08 | Tests (rojos) xUnit del validador: obligatoriedad, mayoría de edad, DNI/NIE, email, teléfono, RGPD | test | AC-002-04, AC-002-05, AC-002-06a..d, AC-002-07a..c, AC-002-08a, AC-002-08b, AC-002-09, AC-002-10, AC-002-11a, AC-002-11b, AC-002-12a, AC-002-12b, AC-002-13a, AC-002-13b, AC-002-14 | `backend/tests/ClaimsManagement.Tests/Application/CreateOnboardingValidatorTests.cs` | — | ☐ |
| T-002-09 | Tests (rojos) xUnit de servicio/repositorio: alta, estado inicial, id único, no persiste inválido, recuperable, duplicado 409 | test | AC-002-01, AC-002-02, AC-002-03, AC-002-15, AC-002-16a, AC-002-16b, AC-002-17a, AC-002-17b | `backend/tests/ClaimsManagement.Tests/Application/OnboardingServiceTests.cs`<br>`backend/tests/ClaimsManagement.Tests/Infrastructure/InMemoryOnboardingRepositoryTests.cs` | — | ☐ |
| T-002-10 | Tests (rojos) de contrato frente a `openapi.yaml` (201/400/409) | test | AC-002-01, AC-002-02, AC-002-17a, AC-002-18 | `backend/tests/ClaimsManagement.Tests/Contract/` | — | ☐ |
| T-002-11 | Tests (rojos) Vitest de `validateOnboardingForm` (dual de T-002-08) | test | AC-002-04, AC-002-05, AC-002-06a..d, AC-002-07a..c, AC-002-08a, AC-002-08b, AC-002-09, AC-002-10, AC-002-11a, AC-002-11b, AC-002-12a, AC-002-12b, AC-002-13a, AC-002-13b, AC-002-14 | `src/lib/onboardingValidation.test.ts` | — | ☐ |
| T-002-12 | Tests (rojos) Vitest del componente `OnboardingForm` (estados UI) | test | AC-002-19, AC-002-20, AC-002-21, AC-002-22 | `src/components/OnboardingForm.test.tsx` | — | ☐ |
| T-002-13 | Entidad `OnboardingRequest`, enums `DocumentType`/`OnboardingStatus`, `SpanishIdDocument`, validador y servicio en backend | impl | REQ-002-01..11, REQ-002-13, REQ-002-14, REQ-002-16 | `backend/src/ClaimsManagement.Domain/Entities/OnboardingRequest.cs`<br>`backend/src/ClaimsManagement.Domain/Enums/DocumentType.cs`<br>`backend/src/ClaimsManagement.Domain/Enums/OnboardingStatus.cs`<br>`backend/src/ClaimsManagement.Application/Common/SpanishIdDocument.cs`<br>`backend/src/ClaimsManagement.Application/Validators/CreateOnboardingValidator.cs`<br>`backend/src/ClaimsManagement.Application/Services/OnboardingService.cs` | — | ☐ |
| T-002-14 | Repositorio con índice único por documento y endpoint `POST /api/onboarding-requests` (201/400/409) | impl | REQ-002-12, REQ-002-15, REQ-002-16, AC-002-18 | `backend/src/ClaimsManagement.Infrastructure/Repositories/InMemoryOnboardingRepository.cs`<br>`backend/src/ClaimsManagement.API/Controllers/OnboardingController.cs` | — | ☐ |
| T-002-15 | Página `/onboarding/new`, `OnboardingForm`, `validateOnboardingForm`, tipos y cliente API | impl | REQ-002-17, AC-002-19..22 | `src/app/onboarding/new/page.tsx`<br>`src/components/OnboardingForm.tsx`<br>`src/lib/onboardingValidation.ts`<br>`src/types/onboarding.ts`<br>`src/lib/api.ts` | — | ☐ |
| T-002-16 | Crear y renombrar frames Figma `UI-002-01..05` en la página "SPEC-002" | doc | UI-002-01..05 | — | — | ☐ (la API REST de Figma es de solo lectura para nodos; plugin o edición manual) |
| T-002-17 | Theme Fluent UI con los tokens de `ui/brand.md` | impl | NFR-002-04, NFR-002-09 | `src/app/providers.tsx` (o theme equivalente) | — | ☐ |
| T-002-18 | Verificar que datos personales no van a logs/telemetría | test | NFR-002-08 | revisión de código + auditoría | — | ☐ |
| T-002-19 | Confirmar decisiones provisionales C-002-01..10 con negocio (incl. clave Jira) | spec | C-002-01..10 | `specs/002-alta-digital-cliente/clarifications.md` | — | ☐ |
| T-002-20 | Prueba de carga del alta en preproducción | test | NFR-002-01 | — | — | ☐ |
| T-002-21 | Crear la historia en Jira y enlazarla con la spec (sustituye SPEC-002) | doc | C-002-01 | — | — | ☐ |
