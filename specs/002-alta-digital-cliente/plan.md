# Plan técnico – 002 Alta digital de cliente (SPEC-002)

> **CÓMO** se implementa [`spec.md`](spec.md). Entradas: `spec.md`, [`clarifications.md`](clarifications.md),
> [`.specify/memory/constitution.md`](../../.specify/memory/constitution.md).
> Este plan cubre el diseño **antes de implementar**: los componentes aún no existen; las rutas indicadas
> son las previstas. La implementación seguirá test-first (Art. 2) en un PR posterior.

## 1. Resumen técnico

API REST .NET 8 (`POST /api/onboarding-requests`) con Clean Architecture y almacenamiento en memoria,
consumida por una página Next.js + Fluent UI v9 (`/onboarding/new`). Las reglas de validación se
implementan en ambos lados con la misma semántica (Art. 6), incluida la mayoría de edad calculada con la
fecha civil en Europe/Madrid (misma base que spec 001, reutilizando `BusinessDate`/`businessDate.ts`).
La unicidad por documento la garantiza el repositorio (índice por tipo + número normalizado) y se traduce
en un 409 Problem Details. La interfaz aplica los tokens de marca documentados en `ui/brand.md`.

## 2. Comprobación de la constitución

| Artículo | Cumple | Notas |
|---|---|---|
| Art. 1 Spec primero | ✔ | Esta carpeta `specs/002-alta-digital-cliente/` |
| Art. 2 Test-first | ◐ | Tests previstos en `tasks.md` (T-002-08..14), antes de cada implementación; cobertura AC↔test exigible al entrar en implementación (C-002-10) |
| Art. 3 Contract-first | ✔ | `contracts/openapi.yaml` definido antes de implementar; lint en CI |
| Art. 4 Trazabilidad | ✔ | `trace-map.json` (sin código aún); `traceability.md` generado |
| Art. 5 Seguridad | ◐ | Job `security` (Snyk) existente; datos personales fuera de logs (NFR-002-08) |
| Art. 6 Validación dual | ✔ | Validador C# y `validateOnboardingForm` (TS) con los mismos mensajes |
| Art. 7 Fechas | ✔ | Mayoría de edad con fecha civil en Europe/Madrid; `createdAt` en UTC |
| Art. 8 Stack | ✔ | .NET 8, Next.js 16, React 19, Fluent UI v9 |
| Art. 9 Ambigüedades | ✔ | `clarifications.md` C-002-01..10 |
| Art. 10 Simplicidad | ✔ | Solo lo especificado; nada de verificación real ni credenciales |

## 3. Arquitectura y componentes

```
src/ (Next.js)                          backend/ (.NET 8 Clean Architecture)
  app/onboarding/new/page.tsx             ClaimsManagement.API   (mismo host de API; ver ADR-002-01)
  components/OnboardingForm.tsx  ──HTTP──▶  Controllers/OnboardingController.cs   (POST /api/onboarding-requests, 201 / 400 / 409 RFC 7807)
  lib/onboardingValidation.ts             ClaimsManagement.Application
  lib/businessDate.ts   (reuso)             Services/OnboardingService.cs
  lib/api.ts                                Validators/CreateOnboardingValidator.cs
  types/onboarding.ts                       Common/SpanishIdDocument.cs   (letra de control DNI/NIE)
                                            Common/BusinessDate.cs        (reuso, Europe/Madrid)
                                          ClaimsManagement.Domain
                                            Entities/OnboardingRequest.cs, Enums/OnboardingStatus.cs, Enums/DocumentType.cs
                                          ClaimsManagement.Infrastructure
                                            Repositories/InMemoryOnboardingRepository.cs  (índice único tipo+nº doc)
```

| Capa | Componente | Responsabilidad | REQ |
|---|---|---|---|
| Domain | `OnboardingRequest.Create` | Crea la entidad con `Id` nuevo, `Status = PendienteVerificacion`, `CreatedAt` UTC | REQ-002-03, REQ-002-12 |
| Domain | `DocumentType` | Catálogo DNI / NIE / Pasaporte | REQ-002-01 |
| Application | `SpanishIdDocument.Normalize/IsValidDni/IsValidNie` | Normalización y letra de control | REQ-002-05, -06, -08 |
| Application | `CreateOnboardingValidator.Validate(request, timeProvider)` | Acumula todos los errores de negocio | REQ-002-01, -02, -04..-11, -13 |
| Application | `BusinessDate.Today(timeProvider)` | Fecha civil actual en Europe/Madrid (reuso spec 001) | REQ-002-04 |
| Application | `OnboardingService.CreateAsync` | Valida, comprueba duplicado, crea y persiste | REQ-002-14, -16 |
| Infrastructure | `InMemoryOnboardingRepository` | Guarda y recupera por `Id`; índice único `(DocumentType, DocumentNumberNormalized)` | REQ-002-15, -16 |
| API | `OnboardingController.Create` | 201 + `OnboardingResponse` / 400 y 409 `ProblemDetails` | REQ-002-12, -13, -16 |
| Frontend | `validateOnboardingForm(values, now)` | Misma validación que el backend | REQ-002-02, -04..-11 |
| Frontend | `OnboardingForm` | Estados UI-002-01..05 y acción "Solicitar alta" | REQ-002-17 |

## 4. Contrato de API

[`contracts/openapi.yaml`](contracts/openapi.yaml) (OpenAPI 3.0.3). Lint con `@redocly/cli`
(`redocly.yaml` en la raíz). Respuestas: 201 `OnboardingResponse`, 400 y 409 `ValidationProblemDetails`
(RFC 7807). Los tests de contrato (mismo patrón que spec 001: `WebApplicationFactory` +
`Microsoft.OpenApi.Readers`) validarán código, `Content-Type` y cuerpo de cada respuesta.

## 5. Modelo de datos

Ver [`data-model.md`](data-model.md): entidad `OnboardingRequest`, enumerados `DocumentType` y
`OnboardingStatus` con la máquina de estados completa (referencia para historias posteriores).

## 6. Interfaz de usuario

Ver [`ui/states.md`](ui/states.md) (mapa UI-ID ↔ estados) y [`ui/brand.md`](ui/brand.md) (tokens de
identidad gráfica extraídos de bancsabadell.com). Una sola acción "Solicitar alta" (C-002-05);
los tokens de marca se mapean sobre el theme de Fluent UI v9 (ADR-002-04).

## 7. Estrategia de pruebas

| Nivel | Herramienta | Qué cubre | Ubicación prevista |
|---|---|---|---|
| Unitario backend | xUnit | Validador (obligatoriedad, mayoría de edad, DNI/NIE, email, teléfono, RGPD), servicio (duplicado), entidad, repositorio | `backend/tests/ClaimsManagement.Tests` |
| Contrato | xUnit + WebApplicationFactory + Microsoft.OpenApi.Readers | Respuestas 201/400/409, media types, DTOs y enums frente a `openapi.yaml` | `backend/tests/ClaimsManagement.Tests/Contract` |
| Unitario frontend | Vitest | `validateOnboardingForm`, `businessDate` | `src/lib/*.test.ts` |
| Componente frontend | Vitest + Testing Library + jsdom | Estados UI y acción | `src/components/*.test.tsx` |
| Conformidad SDD | Python 3 (stdlib) + Redocly | AC ↔ tests (cuando entre en implementación), lint contrato, trazabilidad | `scripts/sdd`, job CI `spec-conformance` |

Etiquetado: xUnit `[Trait("AC", "AC-002-xx")]` + `[Trait("REQ", "REQ-002-xx")]`; Vitest
`it("AC-002-xx …")`. Los tests de fecha fijan el instante actual (`TimeProvider`, `vi.setSystemTime`,
`TZ=UTC` y un caso con `TZ=America/New_York`), igual que en spec 001.

## 8. Decisiones técnicas (ADR ligeras)

| ID | Decisión | Alternativas | Motivo |
|---|---|---|---|
| ADR-002-01 | Reutilizar la API `ClaimsManagement.API` añadiendo `OnboardingController` | Microservicio nuevo | El proyecto es una demo; Clean Architecture ya separa dominio/aplicación; cambiar el nombre del host se revisará en una spec de plataforma |
| ADR-002-02 | Letra de control DNI/NIE con la serie `TRWAGMYFPDXBNJZSQVHLCKE` sobre `número mod 23` en componente `SpanishIdDocument` compartido | Librería externa de validación documental | Sin dependencias; algoritmo público y determinista; mismo código en backend y (portado) en frontend |
| ADR-002-03 | Unicidad por `(DocumentType, DocumentNumber)` ya normalizado en el repositorio en memoria con `ConcurrentDictionary` | Solo en el servicio | La garantía de unicidad vive donde se persiste; devuelve conflicto como resultado tipado |
| ADR-002-04 | Tokens de marca en `ui/brand.md` aplicados sobre el theme de Fluent UI v9 (`brand` ramp) | Sistema Galatea `bs-*` (propietario, no público); CSS a mano | Galatea no es instalable; Fluent UI ya es el stack (Art. 8); los tokens hex se inyectan en el theme |
| ADR-002-05 | Mayoría de edad: `birthDate ≤ BusinessDate.Today() − 18 años` con `AddYears(-18)` (29-feb → 28-feb en año no bisiesto) | Calcular edad en años | Regla de una sola comparación, determinista y testeable; reusa `TimeProvider` |
| ADR-002-06 | Gate: spec "en implementación" = `trace-map.json` con `code` no vacío o algún test citando sus AC; hasta entonces no se exige test por AC | Status en front matter | La señal es objetiva (código/tests existen o no) y no depende de un campo manual; ver C-002-10 |
| ADR-002-07 | Errores 400 y 409 ambos en `application/problem+json` | 409 sin cuerpo | Uniformidad RFC 7807 (NFR-002-02) |

## 9. Riesgos

- El número de documento es un dato personal: aunque hoy se guarda en memoria, no debe aparecer en logs
  ni telemetría (NFR-002-08); revisar al introducir persistencia real.
- El algoritmo de letra de control es público; no aporta veracidad documental — la verificación real
  llega con el proveedor KYC (C-002-02).
- Los tokens de marca se extrajeron de la web pública de Banco Sabadell (observados el 2026-09-30);
  si la identidad oficial difiere, actualizar `ui/brand.md` y el theme (C-002-09).
- Frames Figma pendientes de crear; hasta entonces `ui/states.md` es el mapeo oficial (T-002-16).

## 10. Fuera de este plan

Verificación de identidad (KYC), transiciones de estado, credenciales/OTP, persistencia en BD,
consulta de la solicitud, reanudación de borradores, integración Mulesoft, prueba de carga (NFR-002-01).
