# Constitución del proyecto – Customer Onboarding Control Tower

Versión: 1.0.0 · Ámbito: todo el repositorio.

Principios **no negociables** del ciclo Spec-Driven Development (SDD). Personas y agentes los aplican por igual;
`AGENTS.md` los operacionaliza. Cualquier excepción requiere una enmienda por PR.

## Art. 1 – Spec primero

1. Ningún cambio de comportamiento en `apps/**` se implementa sin `specs/<NNN>-<slug>/spec.md` y `plan.md`.
2. `spec.md` describe **QUÉ** y **POR QUÉ** (REQ, BR, AC, UI, NFR). Las decisiones técnicas viven en `plan.md`,
   `data-model.md` y `contracts/`.
3. La spec es la fuente de verdad. La conversación nunca lo es: lo acordado se escribe en `specs/`.
4. Un cambio de requisito se hace primero en la spec, después en los tests y por último en el código.

## Art. 2 – Test-first

1. Cada `AC` tiene al menos un test automatizado escrito **antes** de la implementación (rojo → verde).
2. El identificador se incluye entre corchetes al inicio del título del test: `test('[AC-001-06] …')`.
   Las reglas de cálculo y NFR se etiquetan igual (`[BR-001]`, `[NFR-001-02]`, `[REQ-001-12]`).
3. Ningún test referencia un ID inexistente en la spec.

## Art. 3 – Contract-first

1. Toda API HTTP se define en `specs/<NNN>-<slug>/contracts/openapi.yaml` (OpenAPI 3.1) antes de implementarla.
2. Los tipos TypeScript de API y web se **generan** desde el contrato; los tests de contrato validan las respuestas
   reales contra el contrato y que no hay rutas fuera de él.
3. El contrato pasa `redocly lint` sin errores.

## Art. 4 – Trazabilidad

1. IDs estables, nunca reutilizados ni renumerados: `REQ-`, `BR-`, `AC-`, `UI-`, `NFR-`, `C-` (clarificaciones), `T-` (tareas).
2. `trace-map.json` enlaza cada REQ/BR/NFR con sus AC, código y tests. `traceability.md` se genera, no se edita.
3. El gate `spec-conformance` falla si un AC no tiene test, si un test cita un ID inexistente o si una entrada de
   `trace-map.json` apunta a un fichero inexistente.

## Art. 5 – Reglas de negocio en backend

1. El frontend nunca calcula reglas de negocio críticas (SLA, conversión, health, comparativas); recibe valores
   agregados y estados (`WITHIN`, `WARNING`, `BREACHED`, `GREEN`…) del backend.
2. Las reglas son funciones puras en `apps/api/src/domain/**`, cubiertas por tests unitarios.
3. Los umbrales son constantes de dominio; no se repiten como literales en la UI.

## Art. 6 – Datos sintéticos y privacidad

1. Todos los datos son sintéticos, deterministas (semilla fija) y anónimos: ningún nombre, documento, teléfono ni correo.
2. Ni logs ni respuestas de error exponen stack traces ni datos internos.

## Art. 7 – Seguridad

1. Toda entrada se valida (Zod) y los errores se devuelven como RFC 7807 Problem Details.
2. Cabeceras de seguridad (Helmet), CORS restringido y `npm audit` sin vulnerabilidades altas.
3. Existen tests de seguridad automatizados (validación, inyección, fuga de información, PII, cabeceras).

## Art. 8 – Ambigüedades

1. Toda ambigüedad se registra en `clarifications.md` con opciones, recomendación y estado.
2. Si no hay respuesta, se aplica la opción más conservadora marcada como
   _"Decisión provisional – pendiente de confirmación"_ y se continúa.

## Art. 9 – Simplicidad

1. No se implementa comportamiento no especificado. Cambios mínimos y enfocados.
