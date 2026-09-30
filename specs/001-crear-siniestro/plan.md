# Plan técnico – 001 Crear siniestro auto (KAN-5)

> **CÓMO** se implementa [`spec.md`](spec.md). Entradas: `spec.md`, [`clarifications.md`](clarifications.md),
> [`.specify/memory/constitution.md`](../../.specify/memory/constitution.md).
> Este plan documenta la implementación existente (PR #3) y los ajustes derivados de la fase Clarify.

## 1. Resumen técnico

API REST .NET 8 (`POST /api/claims`) con Clean Architecture y almacenamiento en memoria, consumida por una
página Next.js + Fluent UI v9 (`/claims/new`). Las reglas de validación se implementan en ambos lados con la
misma semántica (Art. 6), incluida la regla de fecha en Europe/Madrid (C-001-02).

## 2. Comprobación de la constitución

| Artículo | Cumple | Notas |
|---|---|---|
| Art. 1 Spec primero | ✔ | Esta carpeta `specs/001-crear-siniestro/` |
| Art. 2 Test-first | ✔ | Cambios de comportamiento (T-001-10..16) con test rojo previo; los tests existentes se re-etiquetan |
| Art. 3 Contract-first | ✔ | `contracts/openapi.yaml` + tests de contrato (T-001-17) + lint en CI |
| Art. 4 Trazabilidad | ✔ | Traits xUnit / títulos Vitest con AC; `traceability.md` generado |
| Art. 5 Seguridad | ◐ | Job `security` (Snyk) existente; gate High/Critical en `main` pendiente de token Snyk en CI |
| Art. 6 Validación dual | ✔ | `CreateClaimValidator` (C#) y `validateClaimForm` (TS) con los mismos mensajes |
| Art. 7 Fechas | ✔ | `BusinessDate` (C#) y `businessDate.ts` (TS), ambos Europe/Madrid |
| Art. 8 Stack | ✔ | .NET 8, Next.js 16, React 19, Fluent UI v9 |

## 3. Arquitectura y componentes

```
src/ (Next.js)                     backend/ (.NET 8 Clean Architecture)
  app/claims/new/page.tsx            ClaimsManagement.API
  components/ClaimForm.tsx  ──HTTP──▶  Controllers/ClaimsController.cs   (POST /api/claims, 201 / 400 RFC 7807)
  lib/validation.ts                  ClaimsManagement.Application
  lib/businessDate.ts                  Services/ClaimService.cs
  lib/api.ts                           Validators/CreateClaimValidator.cs
  types/claim.ts                       Common/BusinessDate.cs          (hoy en Europe/Madrid)
                                     ClaimsManagement.Domain
                                       Entities/Claim.cs, Enums/ClaimStatus.cs, Enums/ClaimType.cs
                                     ClaimsManagement.Infrastructure
                                       Repositories/InMemoryClaimRepository.cs, DependencyInjection.cs
```

| Capa | Componente | Responsabilidad | REQ |
|---|---|---|---|
| Domain | `Claim.Create` | Crea la entidad con `Id` nuevo, `Status = Draft`, `CreatedAt` UTC | REQ-001-03, REQ-001-07 |
| Application | `CreateClaimValidator.Validate(request, timeProvider)` | Acumula todos los errores de negocio | REQ-001-01, -02, -04, -05, -06, -08 |
| Application | `BusinessDate.Today(timeProvider)` | Fecha civil actual en Europe/Madrid | REQ-001-04 |
| Application | `ClaimService.CreateClaimAsync` | Valida, crea y persiste; no persiste si hay errores | REQ-001-09 |
| Infrastructure | `InMemoryClaimRepository` | Guarda y recupera por `Id` | REQ-001-10 |
| API | `ClaimsController.CreateClaim` | 201 + `ClaimResponse` / 400 `ValidationProblemDetails` | REQ-001-07, -08 |
| Frontend | `validateClaimForm(values, now)` | Misma validación que el backend | REQ-001-02, -04, -05 |
| Frontend | `todayInMadrid`, `isFutureBusinessDate` | Misma regla de fecha que el backend | REQ-001-04 |
| Frontend | `ClaimForm` | Estados UI-001-01..04 y acciones Guardar borrador / Enviar siniestro | REQ-001-11, -12 |

## 4. Contrato de API

[`contracts/openapi.yaml`](contracts/openapi.yaml) (OpenAPI 3.0.3). Lint con `@redocly/cli` (`redocly.yaml` en la raíz).
Los tests de contrato (`backend/tests/ClaimsManagement.ContractTests`) arrancan la API en memoria con
`WebApplicationFactory`, cargan el YAML con `Microsoft.OpenApi.Readers` y validan código de estado,
`Content-Type` y cuerpo de cada respuesta frente al esquema declarado.

## 5. Modelo de datos

Ver [`data-model.md`](data-model.md).

## 6. Interfaz de usuario

Ver [`ui/states.md`](ui/states.md). Ambos botones invocan el mismo `handleSubmit` (C-001-03).

## 7. Estrategia de pruebas

| Nivel | Herramienta | Qué cubre | Ubicación |
|---|---|---|---|
| Unitario backend | xUnit | Validador, servicio, entidad, repositorio | `backend/tests/ClaimsManagement.Tests` |
| Contrato | xUnit + WebApplicationFactory + Microsoft.OpenApi.Readers | Respuestas 201/400 frente a `openapi.yaml` | `backend/tests/ClaimsManagement.ContractTests` |
| Unitario frontend | Vitest | `validateClaimForm`, `businessDate` | `src/lib/__tests__` |
| Componente frontend | Vitest + Testing Library + jsdom | Estados UI y acciones | `src/components/__tests__` |
| Conformidad SDD | Python 3 (stdlib) + Redocly | AC ↔ tests, lint contrato, trazabilidad | `scripts/sdd`, job CI `spec-conformance` |

Etiquetado: xUnit `[Trait("AC", "AC-001-xx")]` + `[Trait("REQ", "REQ-001-xx")]`; Vitest `it("AC-001-xx …")`.
Los tests de fecha inyectan el instante actual (`TimeProvider` en .NET, parámetro `now` en TS) para ser deterministas.

## 8. Decisiones técnicas (ADR ligeras)

| ID | Decisión | Alternativas | Motivo |
|---|---|---|---|
| ADR-001-01 | "Hoy" en .NET con `TimeProvider` + `TimeZoneInfo.FindSystemTimeZoneById("Europe/Madrid")` | `DateTime.Now`, NodaTime | Nativo en .NET 8, testeable, sin dependencias; ICU/tzdata disponibles en Linux y Windows |
| ADR-001-02 | "Hoy" en TS con `Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Madrid" })` y comparación de cadenas `YYYY-MM-DD` | `new Date(...)`, date-fns-tz | Sin dependencias; evita la interpretación UTC de `new Date("YYYY-MM-DD")` |
| ADR-001-03 | `TimeProvider` opcional en `ClaimService` y `CreateClaimValidator` (por defecto `TimeProvider.System`) | Interfaz propia `IClock` | Cambio mínimo, API estándar |
| ADR-001-04 | Validar `Enum.IsDefined` para `ClaimType` | `JsonStringEnumConverter(allowIntegerValues: false)` | No rompe clientes; mensaje de negocio uniforme (C-001-07) |
| ADR-001-05 | Test de contrato en .NET con validador de esquema mínimo propio | Schemathesis, Dredd, Prism | Sin runtime adicional en CI; se ejecuta en el job `test` existente |
| ADR-001-06 | Vitest + Testing Library para el frontend | Jest | Soporta TS/ESM sin Babel; configuración mínima |
| ADR-001-07 | Gate SDD en Python 3 stdlib | Node/TS | Python ya disponible en los runners, sin dependencias |

## 9. Riesgos

- Imágenes de contenedor sin datos de zona horaria: la imagen base de .NET debe incluir `tzdata`/ICU (las oficiales `mcr.microsoft.com/dotnet/aspnet:8.0` los incluyen).
- Snyk depende del secreto `SNYK_TOKEN`; sin él el job `security` no bloquea (`continue-on-error`).
- `node-id` de Figma inferidos del historial; verificar al renombrar frames.

## 10. Fuera de este plan

Transiciones de estado (US3), consulta (US2), persistencia en BD, autenticación, Mulesoft, prueba de carga (NFR-001-01).
