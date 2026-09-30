<!-- GENERADO por scripts/sdd/generate_traceability.py – NO EDITAR A MANO -->
# Trazabilidad – 002-alta-digital-cliente Alta digital de cliente (SPEC-002)

Historia canónica: **SPEC-002**.
Fuentes: `spec.md` (REQ, AC, UI), `trace-map.json` (código, Jira, Figma) y los tests etiquetados
(`[Trait("AC", ...)]` en xUnit, títulos `AC-xxx-yy: ...` en Vitest).

## REQ → AC → Test → Código → Jira → Figma

| REQ | Requisito | AC | Nº tests | Código | Jira | Figma |
|---|---|---|---|---|---|---|
| REQ-002-01 | El sistema permite registrar una solicitud de alta con estos datos obligatorios: nombre, apellidos, tipo de documento, número de documento, fecha de nacimiento, correo electrónico y teléfono móvil. | AC-002-01<br>AC-002-04 | 0 | — | — | — |
| REQ-002-02 | Un dato de texto vacío o formado solo por espacios en blanco se considera no informado y se rechaza con un mensaje asociado a ese campo. | AC-002-04<br>AC-002-05<br>AC-002-20 | 0 | — | — | UI-002-01<br>UI-002-02 |
| REQ-002-03 | Toda solicitud de alta nueva se registra en estado **PendienteVerificacion**. El estado no lo elige el usuario y cualquier estado indicado en la petición se ignora. | AC-002-02 | 0 | — | — | — |
| REQ-002-04 | El solicitante debe ser mayor de edad el día del alta: su fecha de nacimiento debe ser anterior o igual a hoy menos 18 años. "Hoy" es la fecha civil vigente en la zona horaria de negocio **Europe/Madrid**; la comparación se hace por día natural, sin horas. | AC-002-06a<br>AC-002-06b<br>AC-002-06c<br>AC-002-06d | 0 | — | — | — |
| REQ-002-05 | Si el tipo de documento es DNI, el número tiene exactamente 8 dígitos seguidos de la letra de control correcta (la letra correspondiente al número módulo 23 sobre la serie "TRWAGMYFPDXBNJZSQVHLCKE"). | AC-002-07a<br>AC-002-07b<br>AC-002-07c | 0 | — | — | — |
| REQ-002-06 | Si el tipo de documento es NIE, el número tiene una letra inicial X, Y o Z seguida de 7 dígitos y la letra de control correcta (calculada sustituyendo X→0, Y→1, Z→2 y aplicando la misma serie del DNI). | AC-002-08a<br>AC-002-08b | 0 | — | — | — |
| REQ-002-07 | Si el tipo de documento es Pasaporte, el número solo se valida como obligatorio ([C-002-04](clarifications.md#c-002-04--formato-del-pasaporte)). | AC-002-09 | 0 | — | — | — |
| REQ-002-08 | El número de documento se normaliza antes de validar y de comparar (mayúsculas, sin espacios ni guiones). La normalización no modifica el resto de campos. | AC-002-10 | 0 | — | — | — |
| REQ-002-09 | El correo electrónico tiene un formato válido de dirección de correo. | AC-002-11a<br>AC-002-11b | 0 | — | — | — |
| REQ-002-10 | El teléfono móvil tiene exactamente 9 dígitos y empieza por 6 o por 7 ([C-002-03](clarifications.md#c-002-03--formato-del-teléfono)). | AC-002-12a<br>AC-002-12b | 0 | — | — | — |
| REQ-002-11 | El solicitante debe aceptar la política de protección de datos (RGPD) para poder solicitar el alta. El consentimiento de marketing es opcional y se registra como "no" si no se informa. | AC-002-13a<br>AC-002-13b | 0 | — | — | — |
| REQ-002-12 | Al registrar la solicitud se devuelve un identificador único, el estado, la fecha de alta y los datos registrados. | AC-002-01<br>AC-002-03<br>AC-002-22 | 0 | — | — | UI-002-04 |
| REQ-002-13 | Cuando hay varios datos inválidos se informan todos los errores a la vez, no solo el primero. | AC-002-14<br>AC-002-18<br>AC-002-20<br>AC-002-21 | 0 | — | — | UI-002-01<br>UI-002-02<br>UI-002-05 |
| REQ-002-14 | Si los datos no son válidos, no se registra ninguna solicitud de alta. | AC-002-15 | 0 | — | — | — |
| REQ-002-15 | Una solicitud registrada queda guardada y es recuperable por su identificador. | AC-002-16a<br>AC-002-16b | 0 | — | — | — |
| REQ-002-16 | Si ya existe una solicitud registrada con el mismo tipo y número de documento (normalizado), la nueva solicitud se rechaza con el código de conflicto correspondiente. | AC-002-17a<br>AC-002-17b<br>AC-002-18 | 0 | — | — | UI-002-05 |
| REQ-002-17 | La pantalla comunica al solicitante el estado del proceso: edición, errores (por campo y del servicio), envío en curso, solicitud registrada y documento duplicado. | AC-002-17a<br>AC-002-19<br>AC-002-20<br>AC-002-21<br>AC-002-22 | 0 | — | — | UI-002-01<br>UI-002-02<br>UI-002-03<br>UI-002-04<br>UI-002-05 |

## AC → Tests

| AC | Título | REQ | Nº tests | Tests |
|---|---|---|---|---|
| AC-002-01 | Alta correcta de una solicitud | REQ-002-01, REQ-002-12 | 0 | **SIN TEST** |
| AC-002-02 | Estado inicial PendienteVerificacion | REQ-002-03 | 0 | **SIN TEST** |
| AC-002-03 | Identificador único | REQ-002-12 | 0 | **SIN TEST** |
| AC-002-04 | Datos obligatorios no informados | REQ-002-01, REQ-002-02 | 0 | **SIN TEST** |
| AC-002-05 | Texto formado solo por espacios | REQ-002-02 | 0 | **SIN TEST** |
| AC-002-06a | Mayoría de edad cumplida hoy | REQ-002-04 | 0 | **SIN TEST** |
| AC-002-06b | Cumple 18 años mañana | REQ-002-04 | 0 | **SIN TEST** |
| AC-002-06c | Menor de edad | REQ-002-04 | 0 | **SIN TEST** |
| AC-002-06d | Nacimiento un 29 de febrero | REQ-002-04 | 0 | **SIN TEST** |
| AC-002-07a | DNI válido | REQ-002-05 | 0 | **SIN TEST** |
| AC-002-07b | DNI con letra de control incorrecta | REQ-002-05 | 0 | **SIN TEST** |
| AC-002-07c | DNI con formato inválido | REQ-002-05 | 0 | **SIN TEST** |
| AC-002-08a | NIE válido | REQ-002-06 | 0 | **SIN TEST** |
| AC-002-08b | NIE inválido | REQ-002-06 | 0 | **SIN TEST** |
| AC-002-09 | Pasaporte solo obligatorio | REQ-002-07 | 0 | **SIN TEST** |
| AC-002-10 | Normalización del número de documento | REQ-002-08 | 0 | **SIN TEST** |
| AC-002-11a | Correo electrónico válido | REQ-002-09 | 0 | **SIN TEST** |
| AC-002-11b | Correo electrónico inválido | REQ-002-09 | 0 | **SIN TEST** |
| AC-002-12a | Teléfono móvil válido | REQ-002-10 | 0 | **SIN TEST** |
| AC-002-12b | Teléfono móvil inválido | REQ-002-10 | 0 | **SIN TEST** |
| AC-002-13a | Consentimiento RGPD obligatorio | REQ-002-11 | 0 | **SIN TEST** |
| AC-002-13b | Consentimiento de marketing opcional | REQ-002-11 | 0 | **SIN TEST** |
| AC-002-14 | Todos los errores a la vez | REQ-002-13 | 0 | **SIN TEST** |
| AC-002-15 | Datos inválidos no se registran | REQ-002-14 | 0 | **SIN TEST** |
| AC-002-16a | Solicitud recuperable por identificador | REQ-002-15 | 0 | **SIN TEST** |
| AC-002-16b | Identificador inexistente | REQ-002-15 | 0 | **SIN TEST** |
| AC-002-17a | Documento ya registrado | REQ-002-16, REQ-002-17 | 0 | **SIN TEST** |
| AC-002-17b | Mismo número con otro tipo de documento | REQ-002-16 | 0 | **SIN TEST** |
| AC-002-18 | Formato estándar de errores | REQ-002-13, REQ-002-16 | 0 | **SIN TEST** |
| AC-002-19 | Envío en curso | REQ-002-17 | 0 | **SIN TEST** |
| AC-002-20 | Errores de validación en pantalla sin llamar al servicio | REQ-002-17, REQ-002-02, REQ-002-13 | 0 | **SIN TEST** |
| AC-002-21 | Errores devueltos por el servicio | REQ-002-17, REQ-002-13 | 0 | **SIN TEST** |
| AC-002-22 | Confirmación de solicitud | REQ-002-17, REQ-002-12 | 0 | **SIN TEST** |

## UI → Figma

| UI | Estado | AC | Frame Figma |
|---|---|---|---|
| UI-002-01 | Default | AC-002-20 | — |
| UI-002-02 | Error | AC-002-20, AC-002-21 | — |
| UI-002-03 | Loading | AC-002-19 | — |
| UI-002-04 | Success | AC-002-22 | — |
| UI-002-05 | Duplicado | AC-002-17a, AC-002-21 | — |

## Resumen

- REQ: 17 · AC: 33 · AC con ≥ 1 test: 0/33
- Enlaces AC → test: 0
