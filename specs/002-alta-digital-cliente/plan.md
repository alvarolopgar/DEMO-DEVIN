# Plan técnico – 002 Alta digital de cliente (SPEC-002)

> **CÓMO** se implementa [`spec.md`](spec.md). Entradas: `spec.md`, [`clarifications.md`](clarifications.md),
> [`.specify/memory/constitution.md`](../../.specify/memory/constitution.md).
> Este plan cubre el diseño completo (borradores, reanudación, máquina de estados y verificación de
> identidad). Ya existe código: el proveedor de verificación dummy (`IIdentityVerificationService` +
> `DummyIdentityVerificationService`), entregado como scaffolding sustituible (C-002-01). El resto de
> la implementación seguirá test-first (Art. 2) en PRs posteriores.

## 1. Resumen técnico

API REST .NET 8 (`/api/onboarding-requests`) con Clean Architecture y almacenamiento en memoria,
consumida por una página Next.js + Fluent UI v9 (`/onboarding/new`). Ciclo de vida completo:
**crear borrador** (`POST`, datos parciales) → **modificar** (`PATCH`) → **reanudar** (`GET`) →
**enviar** (`POST /{id}/submit`, validación completa + duplicado activo) → **verificar identidad**
(`POST /{id}/verify`, proveedor `IIdentityVerificationService` — dummy determinista) →
**completar** (`POST /{id}/complete`, ClienteCreado); caducidad perezosa a **Caducada** a los 30 días.
Las reglas de validación se implementan en ambos lados con la misma semántica (Art. 6), incluida la
mayoría de edad con fecha civil en Europe/Madrid (reuso de `BusinessDate`/`businessDate.ts`).
La interfaz aplica los tokens de marca documentados en `ui/brand.md`.

## 2. Comprobación de la constitución

| Artículo | Cumple | Notas |
|---|---|---|
| Art. 1 Spec primero | ✔ | Esta carpeta `specs/002-alta-digital-cliente/` |
| Art. 2 Test-first | ◐ | Tests previstos en `tasks.md` antes de cada implementación; cobertura AC↔test exigible al entrar en implementación (C-002-10). El dummy lleva sus propios tests de componente (sin AC) |
| Art. 3 Contract-first | ✔ | `contracts/openapi.yaml` definido antes de implementar; lint en CI |
| Art. 4 Trazabilidad | ✔ | `trace-map.json` (sin código de negocio aún); `traceability.md` generado |
| Art. 5 Seguridad | ◐ | Job `security` (Snyk) existente; datos personales fuera de logs (NFR-002-08) |
| Art. 6 Validación dual | ✔ | Validador C# y `validateOnboardingForm` (TS) con los mismos mensajes |
| Art. 7 Fechas | ✔ | Mayoría de edad y caducidad con fecha civil/instante vía `TimeProvider` (Europe/Madrid); fechas en UTC |
| Art. 8 Stack | ✔ | .NET 8, Next.js 16, React 19, Fluent UI v9 |
| Art. 9 Ambigüedades | ✔ | `clarifications.md` C-002-01..10 |
| Art. 10 Simplicidad | ✔ | Solo lo especificado; proveedor de verificación dummy, sin credenciales ni persistencia real |

## 3. Arquitectura y componentes

```
src/ (Next.js)                          backend/ (.NET 8 Clean Architecture)
  app/onboarding/new/page.tsx             ClaimsManagement.API   (mismo host de API; ver ADR-002-01)
  components/OnboardingForm.tsx  ──HTTP──▶  Controllers/OnboardingController.cs
  lib/onboardingValidation.ts               POST /api/onboarding-requests            (201 Borrador)
  lib/businessDate.ts   (reuso)             GET/PATCH /api/onboarding-requests/{id}  (200/404/409)
  lib/api.ts                                POST /{id}/submit | /verify | /complete (200/400/404/409)
  types/onboarding.ts                     ClaimsManagement.Application
                                            Services/OnboardingService.cs
                                            Validators/SubmitOnboardingValidator.cs (solo en submit)
                                            Common/SpanishIdDocument.cs   (letra de control DNI/NIE)
                                            Common/BusinessDate.cs        (reuso, Europe/Madrid)
                                            Interfaces/IIdentityVerificationService.cs  ◀── EXISTE
                                            Verification/IdentityVerificationRequest.cs ◀── EXISTE
                                            Verification/IdentityVerificationResult.cs  ◀── EXISTE
                                          ClaimsManagement.Domain
                                            Entities/OnboardingRequest.cs (máquina de estados)
                                            Enums/OnboardingStatus.cs, Enums/DocumentType.cs
                                          ClaimsManagement.Infrastructure
                                            Repositories/InMemoryOnboardingRepository.cs
                                              (índice único tipo+nº doc solo para estados activos)
                                            Verification/DummyIdentityVerificationService.cs ◀── EXISTE
```

| Capa | Componente | Responsabilidad | REQ |
|---|---|---|---|
| Domain | `OnboardingRequest.CreateDraft/UpdateDraft/Submit/ApplyVerification/Complete/Expire` | Entidad con máquina de estados; crea en `Borrador` | REQ-002-03, -18..-25 |
| Domain | `DocumentType`, `OnboardingStatus` | Catálogos | REQ-002-01 |
| Application | `SpanishIdDocument.Normalize/IsValidDni/IsValidNie` | Normalización y letra de control | REQ-002-05, -06, -08 |
| Application | `SubmitOnboardingValidator.Validate(request, timeProvider)` | Acumula todos los errores de negocio al enviar | REQ-002-01, -02, -04..-11, -13 |
| Application | `BusinessDate.Today(timeProvider)` | Fecha civil actual en Europe/Madrid (reuso spec 001) | REQ-002-04 |
| Application | `IIdentityVerificationService` | Contrato del proveedor de verificación | REQ-002-21 (**implementado**) |
| Application | `OnboardingService` | Orquesta crear/modificar/recuperar/submit/verify/complete y caducidad | REQ-002-14..-25 |
| Infrastructure | `DummyIdentityVerificationService` | Dummy determinista: documento normalizado que empieza por `99` → Rejected; resto → Verified | REQ-002-21 (**implementado**) |
| Infrastructure | `InMemoryOnboardingRepository` | Guarda y recupera por `Id`; unicidad de `(DocumentType, DocumentNumber)` solo entre estados activos | REQ-002-15, -16 |
| API | `OnboardingController` | 6 operaciones; 201/200 + 400/404/409 `ProblemDetails` | REQ-002-12, -13, -16, -25 |
| Frontend | `validateOnboardingForm(values, now)` | Misma validación que el backend (solo al enviar) | REQ-002-02, -04..-11 |
| Frontend | `OnboardingForm` + `ResumeOnboarding` | Estados UI-002-01..11 y acciones "Guardar borrador"/"Solicitar alta"/"Verificar identidad"/"Completar alta" | REQ-002-17 |

## 4. Contrato de API

[`contracts/openapi.yaml`](contracts/openapi.yaml) (OpenAPI 3.0.3). Lint con `@redocly/cli`
(`redocly.yaml` en la raíz). Operaciones: `createOnboardingDraft` (201), `getOnboardingRequest`,
`updateOnboardingDraft`, `submitOnboardingRequest`, `verifyOnboardingRequest`,
`completeOnboardingRequest` (200), con errores `ProblemDetails` RFC 7807 en 400/404/409.
Los tests de contrato (mismo patrón que spec 001: `WebApplicationFactory` +
`Microsoft.OpenApi.Readers`) validarán código, `Content-Type` y cuerpo de cada respuesta.

## 5. Modelo de datos

Ver [`data-model.md`](data-model.md): entidad `OnboardingRequest` con los campos de ciclo de vida
(`CreatedAt`, `UpdatedAt`, `SubmittedAt`, `VerifiedAt`, `ExpiresAt`, `RejectionReason`), enumerados
`DocumentType` y `OnboardingStatus` (Borrador, PendienteVerificacion, Verificada, Rechazada,
ClienteCreado, Caducada) con la máquina de estados completa, y la interfaz del proveedor de
verificación.

## 6. Interfaz de usuario

Ver [`ui/states.md`](ui/states.md) (mapa UI-ID ↔ estados, 11 estados incluidos borrador guardado,
reanudación, verificada, rechazada, completada y caducada) y [`ui/brand.md`](ui/brand.md) (tokens de
identidad gráfica extraídos de bancsabadell.com). Dos acciones en el formulario ("Guardar borrador",
"Solicitar alta", C-002-04); los tokens de marca se mapean sobre el theme de Fluent UI v9 (ADR-002-04).

## 7. Estrategia de pruebas

| Nivel | Herramienta | Qué cubre | Ubicación |
|---|---|---|---|
| Unitario backend | xUnit | Validador de envío, servicio (duplicado activo, submit), entidad (transiciones, caducidad), repositorio | `backend/tests/ClaimsManagement.Tests` |
| Componente (entregado) | xUnit | `DummyIdentityVerificationService`: verifica docs normales, rechaza docs `99…`, normaliza la entrada | `backend/tests/ClaimsManagement.Tests/Infrastructure/DummyIdentityVerificationServiceTests.cs` |
| Contrato | xUnit + WebApplicationFactory + Microsoft.OpenApi.Readers | Respuestas 201/200/400/404/409, media types, DTOs y enums frente a `openapi.yaml` | `backend/tests/ClaimsManagement.Tests/Contract` |
| Unitario frontend | Vitest | `validateOnboardingForm`, `businessDate` | `src/lib/*.test.ts` |
| Componente frontend | Vitest + Testing Library + jsdom | Estados UI y acciones | `src/components/*.test.tsx` |
| Conformidad SDD | Python 3 (stdlib) + Redocly | AC ↔ tests (cuando entre en implementación), lint contrato, trazabilidad | `scripts/sdd`, job CI `spec-conformance` |

Etiquetado: xUnit `[Trait("AC", "AC-002-xx")]` + `[Trait("REQ", "REQ-002-xx")]`; Vitest
`it("AC-002-xx …")`. Los tests de fecha fijan el instante actual (`TimeProvider`, `vi.setSystemTime`,
`TZ=UTC` y un caso con `TZ=America/New_York`), igual que en spec 001; la caducidad se prueba avanzando
el `TimeProvider` 30 días. Los tests de transición de estado a Rechazada usan un stub de
`IIdentityVerificationService` que devuelve `Rejected` (además del caso `99…` del dummy).

## 8. Decisiones técnicas (ADR ligeras)

| ID | Decisión | Alternativas | Motivo |
|---|---|---|---|
| ADR-002-01 | Reutilizar la API `ClaimsManagement.API` añadiendo `OnboardingController` | Microservicio nuevo | El proyecto es una demo; Clean Architecture ya separa dominio/aplicación; cambiar el nombre del host se revisará en una spec de plataforma |
| ADR-002-02 | Letra de control DNI/NIE con la serie `TRWAGMYFPDXBNJZSQVHLCKE` sobre `número mod 23` en componente `SpanishIdDocument` compartido | Librería externa de validación documental | Sin dependencias; algoritmo público y determinista; mismo código en backend y (portado) en frontend |
| ADR-002-03 | Unicidad por `(DocumentType, DocumentNumber)` normalizado en el repositorio en memoria, considerando solo estados activos (PendienteVerificacion, Verificada, ClienteCreado) | Índice sobre todas las solicitudes; solo en el servicio | Borrador/Rechazada/Caducada no deben bloquear un nuevo alta (C-002-07); la garantía vive donde se persiste |
| ADR-002-04 | Tokens de marca en `ui/brand.md` aplicados sobre el theme de Fluent UI v9 (`brand` ramp) | Sistema Galatea `bs-*` (propietario, no público); CSS a mano | Galatea no es instalable; Fluent UI ya es el stack (Art. 8); los tokens hex se inyectan en el theme |
| ADR-002-05 | Mayoría de edad: `birthDate ≤ BusinessDate.Today() − 18 años` con `AddYears(-18)` (29-feb → 28-feb en año no bisiesto), evaluada **en el envío** | Calcular edad en años; validarla al crear el borrador | Regla de una sola comparación, determinista y testeable; el borrador no exige datos válidos (REQ-002-18) |
| ADR-002-06 | Gate: spec "en implementación" = `trace-map.json` con `code` no vacío o algún test citando sus AC; hasta entonces no se exige test por AC | Status en front matter | La señal es objetiva (código/tests existen o no) y no depende de un campo manual; ver C-002-10 |
| ADR-002-07 | Errores 400, 404 y 409 en `application/problem+json` | 409/404 sin cuerpo | Uniformidad RFC 7807 (NFR-002-02) |
| ADR-002-08 | Verificación de identidad tras la interfaz `IIdentityVerificationService` con implementación dummy determinista (rechaza documentos normalizados que empiezan por `99`) | Proveedor KYC real ahora; endpoint sin verificación | El encargo exige verificación en alcance pero no hay proveedor elegido; el dummy responde a las llamadas, permite probar ambas ramas y se sustituye sin tocar el contrato (C-002-01) |
| ADR-002-09 | Borrador como recurso normal: `POST` crea en Borrador (campos opcionales), `PATCH` actualiza, `GET` reanuda, `POST /{id}/submit` valida y envía | Un único `POST` con flag `draft`; recursos `drafts` separados | Un solo recurso y un solo `id` simplifican la reanudación y la unicidad; el flag en el body mezclaría dos contratos de validación |
| ADR-002-10 | Caducidad perezosa a los 30 días (Borrador desde creación, PendienteVerificacion desde envío), evaluada al acceder con `TimeProvider` | Job/background sweeper | Sin infraestructura de jobs en memoria; determinista en tests; el estado Caducada se materializa en el propio acceso (C-002-08) |
| ADR-002-11 | Proveedor de verificación configurable: `SumsubIdentityVerificationService` (HTTP firmado HMAC-SHA256, `X-App-Token`/`X-App-Access-Ts`/`X-App-Access-Sig`) cuando hay `Sumsub:AppToken`/`SecretKey`/`LevelName` en configuración; si no, `DummyIdentityVerificationService` | Solo dummy; proveedor real obligatorio | Ningún KYC real es gratuito; el sandbox de Sumsub responde simulado por HTTP sin coste, y sin credenciales el flujo no se bloquea (C-002-11) |
| ADR-002-12 | `ApiExceptionHandler` (IExceptionHandler) que mapea cualquier excepción no controlada a `500 application/problem+json` sin trazas, nombres de clase ni rutas | Dejar la Developer Exception Page / traza por defecto | NFR-002-02/-11: los errores internos también deben ser Problem Details y nunca exponer detalles de implementación (C-002-12) |

## 9. Riesgos

- El número de documento es un dato personal: aunque hoy se guarda en memoria, no debe aparecer en logs
  ni telemetría (NFR-002-08); revisar al introducir persistencia real.
- El algoritmo de letra de control es público; no aporta veracidad documental — la verificación real
  llega con el proveedor KYC que sustituya al dummy (C-002-01).
- El dummy rechaza cualquier documento que empiece por `99`: si un documento real lo cumpliese, la
  verificación fallaría; es una convención de demo documentada (C-002-01, EC-002-21).
- Los tokens de marca se extrajeron de la web pública de Banco Sabadell (observados el 2026-09-30);
  si la identidad oficial difiere, actualizar `ui/brand.md` y el theme (C-002-09).
- Frames Figma pendientes de crear; hasta entonces `ui/states.md` es el mapeo oficial (T-002-16).

## 10. Fuera de este plan

Proveedor real de verificación (sustitución del dummy), credenciales/OTP y autenticación, persistencia
en BD, integración Mulesoft, job de caducidad en background, prueba de carga (NFR-002-01).
