<!-- GENERADO por scripts/sdd/generate_traceability.py – NO EDITAR A MANO -->
# Trazabilidad – 002-alta-digital-cliente Alta digital de cliente (002-alta-digital-cliente)

Historia canónica: **002-alta-digital-cliente**.
Fuentes: `spec.md` (REQ, AC, UI), `trace-map.json` (código, Figma) y los tests etiquetados
(`[Trait("AC", ...)]` en xUnit, títulos `AC-xxx-yy: ...` en Vitest).

## REQ → AC → Test → Código → Figma

| REQ | Requisito | AC | Nº tests | Código | Figma |
|---|---|---|---|---|---|
| REQ-002-01 | El sistema permite registrar una solicitud de alta con estos datos obligatorios: nombre, apellidos, tipo de documento, número de documento, fecha de nacimiento, correo electrónico y teléfono móvil. | AC-002-01<br>AC-002-04 | 0 | — | — |
| REQ-002-02 | Un dato de texto vacío o formado solo por espacios en blanco se considera no informado y se rechaza con un mensaje asociado a ese campo. | AC-002-04<br>AC-002-05<br>AC-002-20 | 0 | — | UI-002-01<br>UI-002-02 |
| REQ-002-03 | Toda solicitud nueva se crea en estado **Borrador**. El estado no lo elige el usuario y cualquier estado indicado en la petición se ignora. | AC-002-02 | 0 | — | — |
| REQ-002-04 | El solicitante debe ser mayor de edad el día del envío del alta: su fecha de nacimiento debe ser anterior o igual a hoy menos 18 años. "Hoy" es la fecha civil vigente en la zona horaria de negocio **Europe/Madrid**; la comparación se hace por día natural, sin horas. | AC-002-06a<br>AC-002-06b<br>AC-002-06c<br>AC-002-06d | 0 | — | — |
| REQ-002-05 | Si el tipo de documento es DNI, el número tiene exactamente 8 dígitos seguidos de la letra de control correcta (la letra correspondiente al número módulo 23 sobre la serie "TRWAGMYFPDXBNJZSQVHLCKE"). | AC-002-07a<br>AC-002-07b<br>AC-002-07c | 0 | — | — |
| REQ-002-06 | Si el tipo de documento es NIE, el número tiene una letra inicial X, Y o Z seguida de 7 dígitos y la letra de control correcta (calculada sustituyendo X→0, Y→1, Z→2 y aplicando la misma serie del DNI). | AC-002-08a<br>AC-002-08b | 0 | — | — |
| REQ-002-07 | Si el tipo de documento es Pasaporte, el número solo se valida como obligatorio ([C-002-03](clarifications.md#c-002-03--formato-del-pasaporte)). | AC-002-09 | 0 | — | — |
| REQ-002-08 | El número de documento se normaliza antes de validar y de comparar (mayúsculas, sin espacios ni guiones). La normalización no modifica el resto de campos. | AC-002-10 | 0 | — | — |
| REQ-002-09 | El correo electrónico tiene un formato válido de dirección de correo. | AC-002-11a<br>AC-002-11b | 0 | — | — |
| REQ-002-10 | El teléfono móvil tiene exactamente 9 dígitos y empieza por 6 o por 7 ([C-002-02](clarifications.md#c-002-02--formato-del-teléfono)). | AC-002-12a<br>AC-002-12b | 0 | — | — |
| REQ-002-11 | El solicitante debe aceptar la política de protección de datos (RGPD) para poder enviar el alta. El consentimiento de marketing es opcional y se registra como "no" si no se informa. | AC-002-13a<br>AC-002-13b | 0 | — | — |
| REQ-002-12 | En todas las operaciones sobre la solicitud se devuelve su identificador único, su estado, sus fechas (creación, modificación y, si procede, envío y caducidad) y los datos registrados. | AC-002-01<br>AC-002-03<br>AC-002-22<br>AC-002-23 | 0 | — | UI-002-04<br>UI-002-06 |
| REQ-002-13 | Cuando hay varios datos inválidos se informan todos los errores a la vez, no solo el primero. | AC-002-14<br>AC-002-18<br>AC-002-20<br>AC-002-21<br>AC-002-25 | 0 | — | UI-002-01<br>UI-002-02<br>UI-002-05 |
| REQ-002-14 | Si los datos no son válidos al enviar, la solicitud permanece en Borrador y no cambia de estado. | AC-002-15<br>AC-002-25 | 0 | — | — |
| REQ-002-15 | Toda solicitud queda guardada y es recuperable por su identificador, en cualquier estado, lo que permite reanudar un borrador o consultar su resultado. | AC-002-16a<br>AC-002-16b<br>AC-002-24<br>AC-002-26 | 0 | — | UI-002-07 |
| REQ-002-16 | Solo puede existir una solicitud **activa** (PendienteVerificacion, Verificada o ClienteCreado) por tipo y número de documento normalizado. Los estados Borrador, Rechazada y Caducada no bloquean ([C-002-07](clarifications.md#c-002-07--duplicado-de-documento-código-de-respuesta)). | AC-002-17a<br>AC-002-17b<br>AC-002-18<br>AC-002-33<br>AC-002-34 | 0 | — | UI-002-05 |
| REQ-002-17 | La pantalla comunica al solicitante el estado del proceso: edición, errores (por campo y del servicio), envío en curso, borrador guardado, reanudación, solicitud enviada, resultado de la verificación, alta completada y solicitud caducada o duplicada. | AC-002-17a<br>AC-002-19<br>AC-002-20<br>AC-002-21<br>AC-002-22<br>AC-002-26 | 0 | — | UI-002-01<br>UI-002-02<br>UI-002-03<br>UI-002-04<br>UI-002-05<br>UI-002-07 |
| REQ-002-18 | El sistema permite guardar una solicitud incompleta como **borrador** con cualquier subconjunto de los datos (incluso vacío), sin aplicar validación de negocio. | AC-002-23<br>AC-002-33 | 0 | — | UI-002-06 |
| REQ-002-19 | Un borrador se puede modificar mientras siga en estado Borrador; cada modificación actualiza su fecha de modificación. | AC-002-24 | 0 | — | — |
| REQ-002-20 | Al enviar la solicitud se aplican todas las validaciones (REQ-002-01..-11, REQ-002-13) y pasa a **PendienteVerificacion**. | AC-002-01<br>AC-002-02<br>AC-002-25 | 0 | — | — |
| REQ-002-21 | El sistema verifica la identidad del solicitante mediante un proveedor de verificación, sobre el documento y los datos personales informados. | AC-002-27<br>AC-002-28 | 0 | — | UI-002-08<br>UI-002-09 |
| REQ-002-22 | Si la verificación es satisfactoria la solicitud pasa a **Verificada**; si es negativa pasa a **Rechazada** registrando el motivo devuelto por el proveedor. | AC-002-27<br>AC-002-28 | 0 | — | UI-002-08<br>UI-002-09 |
| REQ-002-23 | Con la identidad verificada, el sistema completa el alta creando el expediente del cliente y la solicitud pasa a **ClienteCreado**. | AC-002-29 | 0 | — | UI-002-10 |
| REQ-002-24 | Una solicitud en Borrador caduca a los **30 días** de su creación y una en PendienteVerificacion a los 30 días de su envío, pasando a **Caducada**. Una solicitud Caducada no admite modificaciones ni más transiciones ([C-002-08](clarifications.md#c-002-08--caducidad-de-las-solicitudes)). | AC-002-30<br>AC-002-31 | 0 | — | UI-002-11 |
| REQ-002-25 | Solo son válidas las transiciones de estado documentadas en [`data-model.md`](data-model.md); cualquier operación incompatible con el estado actual se rechaza con el código de conflicto correspondiente. | AC-002-18<br>AC-002-32 | 0 | — | — |

## AC → Tests

| AC | Título | REQ | Nº tests | Tests |
|---|---|---|---|---|
| AC-002-01 | Alta correcta de una solicitud | REQ-002-01, REQ-002-12, REQ-002-20 | 0 | **SIN TEST** |
| AC-002-02 | El estado no lo elige el usuario | REQ-002-03, REQ-002-20 | 0 | **SIN TEST** |
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
| AC-002-15 | Datos inválidos no se envían | REQ-002-14 | 0 | **SIN TEST** |
| AC-002-16a | Solicitud recuperable por identificador | REQ-002-15 | 0 | **SIN TEST** |
| AC-002-16b | Identificador inexistente | REQ-002-15 | 0 | **SIN TEST** |
| AC-002-17a | Documento con solicitud activa | REQ-002-16, REQ-002-17 | 0 | **SIN TEST** |
| AC-002-17b | Mismo número con otro tipo de documento | REQ-002-16 | 0 | **SIN TEST** |
| AC-002-18 | Formato estándar de errores | REQ-002-13, REQ-002-16, REQ-002-25 | 0 | **SIN TEST** |
| AC-002-19 | Envío en curso | REQ-002-17 | 0 | **SIN TEST** |
| AC-002-20 | Errores de validación en pantalla sin llamar al servicio | REQ-002-17, REQ-002-02, REQ-002-13 | 0 | **SIN TEST** |
| AC-002-21 | Errores devueltos por el servicio | REQ-002-17, REQ-002-13 | 0 | **SIN TEST** |
| AC-002-22 | Confirmación de envío | REQ-002-17, REQ-002-12 | 0 | **SIN TEST** |
| AC-002-23 | Guardar borrador incompleto | REQ-002-18, REQ-002-12 | 0 | **SIN TEST** |
| AC-002-24 | Modificar un borrador | REQ-002-19, REQ-002-15 | 0 | **SIN TEST** |
| AC-002-25 | Enviar un borrador incompleto | REQ-002-20, REQ-002-13, REQ-002-14 | 0 | **SIN TEST** |
| AC-002-26 | Reanudar un borrador | REQ-002-15, REQ-002-17 | 0 | **SIN TEST** |
| AC-002-27 | Verificación de identidad satisfactoria | REQ-002-21, REQ-002-22 | 0 | **SIN TEST** |
| AC-002-28 | Verificación de identidad rechazada | REQ-002-21, REQ-002-22 | 0 | **SIN TEST** |
| AC-002-29 | Alta completada | REQ-002-23 | 0 | **SIN TEST** |
| AC-002-30 | Caducidad de un borrador | REQ-002-24 | 0 | **SIN TEST** |
| AC-002-31 | Caducidad pendiente de verificación | REQ-002-24 | 0 | **SIN TEST** |
| AC-002-32 | Transiciones inválidas | REQ-002-25 | 0 | **SIN TEST** |
| AC-002-33 | Dos borradores con el mismo documento | REQ-002-16, REQ-002-18 | 0 | **SIN TEST** |
| AC-002-34 | Solicitud Rechazada o Caducada no bloquea | REQ-002-16 | 0 | **SIN TEST** |

## UI → Figma

| UI | Estado | AC | Frame Figma |
|---|---|---|---|
| UI-002-01 | Default | AC-002-20 | — |
| UI-002-02 | Error | AC-002-20, AC-002-21 | — |
| UI-002-03 | Loading | AC-002-19 | — |
| UI-002-04 | Enviada | AC-002-22 | — |
| UI-002-05 | Duplicado | AC-002-17a, AC-002-21 | — |
| UI-002-06 | Borrador guardado | AC-002-23 | — |
| UI-002-07 | Reanudación | AC-002-26 | — |
| UI-002-08 | Verificada | AC-002-27 | — |
| UI-002-09 | Rechazada | AC-002-28 | — |
| UI-002-10 | Completada | AC-002-29 | — |
| UI-002-11 | Caducada | AC-002-30, AC-002-31 | — |

## Resumen

- REQ: 25 · AC: 45 · AC con ≥ 1 test: 0/45
- Enlaces AC → test: 0
