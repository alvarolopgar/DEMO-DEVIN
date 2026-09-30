---
spec: "001-crear-siniestro"
title: "Crear siniestro auto"
jira: "KAN-5"
jira_aliases: ["DDD-2"]
epic: "DDD-1"
status: "En revisión"
version: "1.0.0"
---

# 001 – Crear siniestro auto (KAN-5)

> Solo **QUÉ** y **POR QUÉ**. Las decisiones técnicas están en [`plan.md`](plan.md).
> Clave canónica: **KAN-5** (alias Jira: DDD-2, ver [C-001-01](clarifications.md#c-001-01--clave-canónica-de-la-historia)).
> Mapeo de IDs antiguos (BR-/VF-/VB-/AC-01..10/AC1..AC5) → nuevos: ver [§10](#10-mapeo-de-ids-antiguos).

## 1. Contexto y objetivo

Un gestor de siniestros necesita registrar un siniestro de auto con todos sus datos obligatorios para iniciar su
tramitación. El siniestro se registra siempre en estado **Draft** (borrador); el resto del ciclo de vida
(envío, revisión, aprobación, rechazo) se trata en historias posteriores.

## 2. Actores

- **Gestor de siniestros**: usuario que da de alta el siniestro.

## 3. Alcance

### Dentro de alcance
- Pantalla de alta de siniestro con los 9 campos obligatorios.
- Validación de los datos (en la pantalla y en el servicio) con la misma semántica.
- Registro del siniestro en estado Draft y confirmación con su identificador.
- Acciones "Guardar borrador" y "Enviar siniestro", ambas registran el siniestro en Draft
  ([C-001-03](clarifications.md#c-001-03--guardar-borrador-vs-enviar-siniestro)).

### Fuera de alcance
- Consultar / visualizar un siniestro (US2 – DDD-7).
- Actualizar datos y transiciones de estado Draft → Submitted → UnderReview → Approved/Rejected, incluida la regla
  "no se puede aprobar sin descripción" (US3 – DDD-12). La máquina de estados completa se documenta como referencia
  en [`data-model.md`](data-model.md).
- Guardar borradores incompletos (sin todos los campos obligatorios) ([C-001-03](clarifications.md#c-001-03--guardar-borrador-vs-enviar-siniestro)).
- Autenticación, autorización y registro del usuario creador ([C-001-09](clarifications.md#c-001-09--usuario-creador-y-autenticación)).
- Validación de existencia de la póliza e integración con Mulesoft ([C-001-10](clarifications.md#c-001-10--validación-de-póliza-e-integración-mulesoft)).
- Idempotencia en servidor ([C-001-05](clarifications.md#c-001-05--doble-clic-e-idempotencia)).

## 4. Requisitos funcionales

| ID | Requisito |
|---|---|
| REQ-001-01 | El sistema permite registrar un siniestro de auto con estos 9 datos obligatorios: número de póliza, fecha del siniestro, tipo de siniestro, matrícula del vehículo, nombre del asegurado, teléfono, dirección, código postal y descripción. |
| REQ-001-02 | Un dato de texto vacío o formado solo por espacios en blanco se considera no informado y se rechaza con un mensaje asociado a ese campo. |
| REQ-001-03 | Todo siniestro nuevo se registra en estado **Draft**. El estado no lo elige el usuario y cualquier estado indicado en la petición se ignora. |
| REQ-001-04 | La fecha del siniestro no puede ser posterior al día actual. "Día actual" es la fecha civil vigente en la zona horaria de negocio **Europe/Madrid**; la comparación se hace por día natural, sin horas. |
| REQ-001-05 | El código postal tiene exactamente 5 dígitos numéricos; se admiten ceros a la izquierda. |
| REQ-001-06 | El tipo de siniestro es uno de: Colisión, Robo, Incendio, Cristales. Cualquier otro valor se rechaza. |
| REQ-001-07 | Al registrar el siniestro se devuelve un identificador único, el estado, la fecha de alta y los datos registrados. |
| REQ-001-08 | Cuando hay varios datos inválidos se informan todos los errores a la vez, no solo el primero. |
| REQ-001-09 | Si los datos no son válidos, no se registra ningún siniestro. |
| REQ-001-10 | Un siniestro registrado queda guardado y es recuperable por su identificador. |
| REQ-001-11 | La pantalla ofrece dos acciones, "Guardar borrador" y "Enviar siniestro"; ambas validan los datos y registran el siniestro en estado Draft. |
| REQ-001-12 | La pantalla comunica al gestor el estado del proceso: edición, errores (por campo y del servicio), envío en curso y registro correcto con el identificador y estado. |

## 5. Criterios de aceptación

### AC-001-01 – Alta correcta de un siniestro
REQ: REQ-001-01, REQ-001-07

```gherkin
Scenario: Registrar un siniestro con todos los datos válidos
  Given un gestor que ha informado los 9 datos obligatorios con valores válidos
  When registra el siniestro
  Then el siniestro queda registrado
  And se devuelve su identificador, su estado, su fecha de alta y los mismos datos informados
```

### AC-001-02 – Estado inicial Draft
REQ: REQ-001-03

```gherkin
Scenario: El estado inicial es siempre Draft
  Given unos datos de siniestro válidos
  And la petición indica un estado distinto de Draft (por ejemplo "Approved")
  When se registra el siniestro
  Then el estado del siniestro registrado es "Draft"
```

### AC-001-03 – Identificador único
REQ: REQ-001-07

```gherkin
Scenario: Cada siniestro recibe un identificador distinto
  Given dos o más altas de siniestro válidas
  When se registran
  Then cada siniestro tiene un identificador no vacío y distinto de los demás
```

### AC-001-04 – Datos obligatorios no informados
REQ: REQ-001-01, REQ-001-02

```gherkin
Scenario Outline: Rechazo cuando falta un dato obligatorio
  Given unos datos de siniestro válidos
  And el dato "<campo>" no está informado
  When se intenta registrar el siniestro
  Then se rechaza con el mensaje "<mensaje>" asociado al campo "<campo>"

  Examples:
    | campo                | mensaje                                        |
    | número de póliza     | El número de póliza es obligatorio.            |
    | fecha del siniestro  | La fecha del siniestro es obligatoria.         |
    | matrícula            | La matrícula del vehículo es obligatoria.      |
    | nombre del asegurado | El nombre del asegurado es obligatorio.        |
    | teléfono             | El teléfono es obligatorio.                    |
    | dirección            | La dirección es obligatoria.                   |
    | código postal        | El código postal es obligatorio.               |
    | descripción          | La descripción es obligatoria.                 |
```

### AC-001-05 – Texto formado solo por espacios
REQ: REQ-001-02

```gherkin
Scenario: Un texto con solo espacios, tabuladores o saltos de línea equivale a vacío
  Given unos datos de siniestro válidos
  And la descripción (o el número de póliza) contiene solo espacios en blanco
  When se intenta registrar el siniestro
  Then se rechaza con el mensaje de dato obligatorio de ese campo
```

### AC-001-06a – Fecha futura (mañana en Europe/Madrid)
REQ: REQ-001-04

```gherkin
Scenario: Rechazo de una fecha posterior al día actual en Europe/Madrid
  Given el día actual en Europe/Madrid es D
  And la fecha del siniestro es D+1 o posterior
  When se intenta registrar el siniestro
  Then se rechaza con el mensaje "La fecha del siniestro no puede ser futura."
```

### AC-001-06b – Hoy en Europe/Madrid es válido aunque en UTC aún sea ayer (horario de invierno)
REQ: REQ-001-04

```gherkin
Scenario: Fecha de hoy aceptada justo después de medianoche en Madrid (CET, UTC+1)
  Given el instante actual es 2026-01-15T23:30:00Z (2026-01-16 00:30 en Europe/Madrid)
  And la fecha del siniestro es 2026-01-16
  When se registra el siniestro
  Then no hay error de fecha
```

### AC-001-06c – Hoy en Europe/Madrid es válido aunque en UTC aún sea ayer (horario de verano)
REQ: REQ-001-04

```gherkin
Scenario: Fecha de hoy aceptada justo después de medianoche en Madrid (CEST, UTC+2)
  Given el instante actual es 2026-06-30T22:30:00Z (2026-07-01 00:30 en Europe/Madrid)
  And la fecha del siniestro es 2026-07-01
  When se registra el siniestro
  Then no hay error de fecha
```

### AC-001-06d – Último instante del día en Europe/Madrid
REQ: REQ-001-04

```gherkin
Scenario: A las 23:59:59 en Madrid el día siguiente sigue siendo futuro y el actual es válido
  Given el instante actual es 2026-01-15T22:59:59Z (2026-01-15 23:59:59 en Europe/Madrid)
  When la fecha del siniestro es 2026-01-16
  Then se rechaza con el mensaje "La fecha del siniestro no puede ser futura."
  When la fecha del siniestro es 2026-01-15
  Then no hay error de fecha
```

### AC-001-06e – Fecha de hoy y fechas pasadas
REQ: REQ-001-04

```gherkin
Scenario: Se aceptan el día actual y las fechas anteriores
  Given la fecha del siniestro es hoy (Europe/Madrid), ayer o cualquier fecha pasada
  When se registra el siniestro
  Then no hay error de fecha
```

### AC-001-07a – Código postal válido
REQ: REQ-001-05

```gherkin
Scenario Outline: Código postal de 5 dígitos, con o sin ceros a la izquierda
  Given el código postal es "<cp>"
  When se registra el siniestro
  Then no hay error de código postal

  Examples:
    | cp    |
    | 28001 |
    | 08001 |
    | 00000 |
    | 99999 |
```

### AC-001-07b – Código postal inválido
REQ: REQ-001-05

```gherkin
Scenario Outline: Código postal que no tiene exactamente 5 dígitos numéricos
  Given el código postal es "<cp>"
  When se intenta registrar el siniestro
  Then se rechaza con el mensaje "El código postal debe tener exactamente 5 dígitos."

  Examples:
    | cp     |
    | 1234   |
    | 123456 |
    | ABCDE  |
    | 1234A  |
    | 28 01  |
    | 280.1  |
```

### AC-001-08a – Tipos de siniestro admitidos
REQ: REQ-001-06

```gherkin
Scenario Outline: Cada tipo del catálogo es aceptado
  Given el tipo de siniestro es "<tipo>"
  When se registra el siniestro
  Then el siniestro queda registrado con el tipo "<tipo>"

  Examples:
    | tipo      |
    | Colisión  |
    | Robo      |
    | Incendio  |
    | Cristales |
```

### AC-001-08b – Tipo de siniestro fuera de catálogo
REQ: REQ-001-06

```gherkin
Scenario: Un tipo que no pertenece al catálogo se rechaza
  Given el tipo de siniestro no es ninguno de Colisión, Robo, Incendio, Cristales
  When se intenta registrar el siniestro
  Then se rechaza y no se registra el siniestro
```

### AC-001-09 – Todos los errores a la vez
REQ: REQ-001-08

```gherkin
Scenario: Varios datos inválidos generan todos sus errores simultáneamente
  Given varios datos obligatorios vacíos, una fecha futura y un código postal inválido
  When se intenta registrar el siniestro
  Then se devuelven en una sola respuesta los errores de todos esos campos
```

### AC-001-10 – Datos inválidos no se registran
REQ: REQ-001-09

```gherkin
Scenario: Un alta rechazada no deja rastro
  Given unos datos de siniestro con al menos un error de validación
  When se intenta registrar el siniestro
  Then no se devuelve identificador y no se registra ningún siniestro
```

### AC-001-11a – Siniestro recuperable por identificador
REQ: REQ-001-10

```gherkin
Scenario: El siniestro registrado se puede recuperar
  Given un siniestro registrado correctamente
  When se recupera por su identificador
  Then se obtiene el mismo siniestro, en estado Draft
```

### AC-001-11b – Identificador inexistente
REQ: REQ-001-10

```gherkin
Scenario: Recuperar un identificador que no existe no devuelve nada
  Given un identificador que no corresponde a ningún siniestro
  When se intenta recuperar
  Then no se obtiene ningún siniestro
```

### AC-001-12 – "Guardar borrador" y "Enviar siniestro" registran en Draft
REQ: REQ-001-11, REQ-001-03

```gherkin
Scenario Outline: Ambas acciones registran el siniestro en Draft
  Given un gestor en la pantalla de alta con todos los datos válidos
  When pulsa "<acción>"
  Then se registra el siniestro una sola vez
  And la pantalla muestra el estado "Draft"

  Examples:
    | acción            |
    | Guardar borrador  |
    | Enviar siniestro  |
```

### AC-001-13 – Errores de validación en pantalla sin llamar al servicio
REQ: REQ-001-12, REQ-001-02, REQ-001-08

```gherkin
Scenario: El formulario muestra los errores por campo antes de enviar
  Given un gestor en la pantalla de alta con campos obligatorios vacíos
  When pulsa "Enviar siniestro"
  Then se muestran los mensajes de error junto a cada campo afectado
  And no se envía ninguna petición al servicio
```

### AC-001-14 – Confirmación de alta
REQ: REQ-001-12, REQ-001-07

```gherkin
Scenario: La pantalla confirma el registro con identificador y estado
  Given un alta de siniestro correcta
  When el servicio confirma el registro
  Then la pantalla muestra "Siniestro creado correctamente", el identificador y "Estado: Draft"
  And ofrece la acción "Crear nuevo siniestro"
```

### AC-001-15 – Errores devueltos por el servicio
REQ: REQ-001-12, REQ-001-08

```gherkin
Scenario: La pantalla muestra los errores de validación devueltos por el servicio
  Given el servicio rechaza el alta con uno o varios mensajes de validación
  When el gestor envía el formulario
  Then la pantalla muestra cada mensaje devuelto por el servicio
```

### AC-001-16 – Formato estándar de errores
REQ: REQ-001-08

```gherkin
Scenario: Los errores de validación del servicio siguen el formato Problem Details (RFC 7807)
  Given una petición de alta con datos inválidos
  When se envía al servicio
  Then la respuesta tiene código 400
  And el cuerpo incluye title, status, detail y la lista de mensajes de validación
  And la respuesta cumple el contrato publicado
```

### AC-001-17 – Envío en curso
REQ: REQ-001-12

```gherkin
Scenario: Mientras se registra el siniestro no se puede volver a enviar
  Given un gestor que ha pulsado "Enviar siniestro" con datos válidos
  When el servicio aún no ha respondido
  Then la pantalla muestra "Enviando siniestro..."
  And las acciones "Guardar borrador" y "Enviar siniestro" no están disponibles
```

## 6. Estados de interfaz

| ID | Estado | Descripción | AC |
|---|---|---|---|
| UI-001-01 | Default | Formulario vacío con los 9 campos marcados como obligatorios, indicador "Estado: Draft" y acciones "Guardar borrador" y "Enviar siniestro". | AC-001-12 |
| UI-001-02 | Error | Mensajes por campo bajo cada campo inválido y/o avisos con los errores devueltos por el servicio. | AC-001-13, AC-001-15 |
| UI-001-03 | Loading | Indicador "Enviando siniestro..."; acciones no disponibles. | AC-001-17 |
| UI-001-04 | Success | "Siniestro creado correctamente", identificador, "Estado: Draft" y acción "Crear nuevo siniestro". | AC-001-14 |

Diseños y enlaces a Figma: [`ui/states.md`](ui/states.md).

## 7. Requisitos no funcionales (medibles)

| ID | Requisito | Métrica / umbral | Verificación |
|---|---|---|---|
| NFR-001-01 | Rendimiento del alta | p95 del registro de un siniestro < 300 ms con 20 peticiones/s sostenidas durante 60 s en el entorno de preproducción | Prueba de carga (pendiente de entorno, T-001-24) |
| NFR-001-02 | Errores estándar | 100 % de las respuestas de validación con código 400 en formato Problem Details (RFC 7807) | AC-001-16 (tests de contrato) |
| NFR-001-03 | Seguridad | 0 vulnerabilidades High/Critical (Snyk SCA) en dependencias de producción | Job CI `security` |
| NFR-001-04 | Accesibilidad | Todos los campos tienen etiqueta accesible y se marcan como obligatorios; objetivo WCAG 2.1 AA | Tests de UI por etiqueta (AC-001-12/13); auditoría axe pendiente |
| NFR-001-05 | Contrato estable | El servicio cumple al 100 % el contrato `contracts/openapi.yaml`, que pasa el linter sin errores | Tests de contrato + job CI `spec-conformance` |
| NFR-001-06 | Validación dual coherente | Las reglas REQ-001-02, -04, -05 dan el mismo resultado en pantalla y en servicio para los mismos datos e instante | Tests AC-001-04..07 en backend y frontend |
| NFR-001-07 | Cobertura de aceptación | 100 % de los AC con ≥ 1 test automatizado; 0 tests con AC inexistente | Job CI `spec-conformance` |

## 8. Casos límite

| ID | Caso | Comportamiento esperado | AC |
|---|---|---|---|
| EC-001-01 | Código postal con ceros a la izquierda ("08001") | Válido | AC-001-07a |
| EC-001-02 | Descripción solo con espacios, tabuladores o saltos de línea | Equivale a vacía → error de obligatoriedad | AC-001-05 |
| EC-001-03 | Doble clic en "Enviar siniestro" | Solo se registra un siniestro: las acciones dejan de estar disponibles durante el envío | AC-001-17 |
| EC-001-04 | Alta entre las 00:00 y la 01:00/02:00 de Madrid (UTC aún en el día anterior) | La fecha de hoy (Madrid) es válida | AC-001-06b, AC-001-06c |
| EC-001-05 | Alta a las 23:59:59 de Madrid | El día siguiente es futuro; el actual es válido | AC-001-06d |
| EC-001-06 | La petición incluye un estado distinto de Draft | Se ignora; el estado es Draft | AC-001-02 |
| EC-001-07 | Tipo de siniestro fuera de catálogo (p. ej. valor numérico no definido) | Se rechaza | AC-001-08b |
| EC-001-08 | Fecha del siniestro no informada | Se rechaza con "La fecha del siniestro es obligatoria." | AC-001-04 |

## 9. Preguntas abiertas y decisiones

Ver [`clarifications.md`](clarifications.md). Decisiones provisionales pendientes de confirmación:
C-001-01, C-001-02, C-001-03, C-001-04, C-001-05, C-001-07, C-001-08, C-001-09, C-001-11, C-001-12.

## 10. Mapeo de IDs antiguos

Fuentes: análisis funcional original (`analisis_gestion_siniestro_auto.md`: RF-, BR-, VF-, VB-, EC-),
Jira DDD-2 (AC1..AC5) y comentarios de los tests xUnit (AC-01..AC-10). Los IDs antiguos quedan **congelados**; solo se usan los nuevos.

| ID antiguo | Fuente | Descripción original | ID nuevo | Nota |
|---|---|---|---|---|
| RF-01 | Análisis | Crear siniestro | REQ-001-01 | |
| RF-02 / RF-04 | Análisis | Visualizar / listar siniestros | — | Fuera de alcance (US2) |
| RF-03 | Análisis | Actualizar siniestro | — | Fuera de alcance (US3) |
| RF-05..RF-13 | Análisis | Campos obligatorios | REQ-001-01 | |
| RF-14 / RF-22 / BR-DRF-01 | Análisis | Estado inicial Draft | REQ-001-03 | |
| RF-15..RF-18 | Análisis | Transiciones de estado | — | Fuera de alcance (US3); ver `data-model.md` |
| RF-19 / BR-APR-01 / VB-09 | Análisis | No aprobar sin descripción | — | Fuera de alcance (US3); ver `data-model.md` |
| RF-20 / BR-SUB-02 / VF-02 / VB-02 / VB-11 | Análisis | Fecha no futura | REQ-001-04 | Zona Europe/Madrid (C-001-02) sustituye a "UTC" |
| RF-21 / BR-SUB-03 / VF-08 / VB-08 | Análisis | CP 5 dígitos | REQ-001-05 | |
| VF-01 / VB-01 | Análisis | Póliza obligatoria | REQ-001-01, REQ-001-02 | Existencia de póliza fuera de alcance (C-001-10) |
| VF-03 / VB-03 | Análisis | Tipo válido del enum | REQ-001-06 | |
| VF-04 / VB-04 | Análisis | Matrícula obligatoria + formato | REQ-001-01 | Formato no validado (C-001-04) |
| VF-05 / VB-05 | Análisis | Nombre obligatorio + longitud mínima | REQ-001-01 | Longitud/charset no validados (C-001-04) |
| VF-06 / VB-06 | Análisis | Teléfono obligatorio + formato | REQ-001-01 | Formato no validado (C-001-04) |
| VF-07 / VB-07 | Análisis | Dirección obligatoria + longitud mínima | REQ-001-01 | Longitud no validada (C-001-04) |
| VF-09 | Análisis | Descripción obligatoria | REQ-001-01, REQ-001-02 | |
| VF-10 | Análisis | Formulario completo antes de enviar | REQ-001-12, AC-001-13 | Se valida al pulsar, no se deshabilita el botón |
| VF-11 / VB-10 | Análisis | Botones/transiciones según estado | — | Fuera de alcance (US3) |
| VB-12 | Análisis | Concurrencia optimista | — | Fuera de alcance (US3) |
| VB-13 | Análisis | Autorización | — | Fuera de alcance (C-001-09) |
| VB-14 | Análisis | Idempotencia | EC-001-03 | Solo mitigación en UI (C-001-05) |
| BR-DRF-04 | Análisis | Guardar borrador sin todos los campos | — | No aplica en KAN-5 (C-001-03) |
| EC-01 | Análisis | Fecha en zona horaria diferente | EC-001-04, EC-001-05 | Resuelto con C-001-02 |
| EC-02 | Análisis | Fecha = hoy 23:59 | EC-001-05, AC-001-06d | |
| EC-03 | Análisis | CP con ceros a la izquierda | EC-001-01, AC-001-07a | |
| EC-05 | Análisis | Descripción solo espacios | EC-001-02, AC-001-05 | |
| EC-07 | Análisis | Doble clic en Enviar | EC-001-03, AC-001-17 | |
| EC-14 | Análisis | Descripción extremadamente larga | — | C-001-11 |
| AC1 | Jira DDD-2 | Alta válida → Draft + confirmación | AC-001-01, AC-001-12, AC-001-14 | |
| AC2 | Jira DDD-2 | Fecha futura → error | AC-001-06a..e | |
| AC3 | Jira DDD-2 | CP no 5 dígitos → error | AC-001-07a, AC-001-07b | |
| AC4 | Jira DDD-2 | Campos vacíos → errores inline | AC-001-04, AC-001-13 | |
| AC5 | Jira DDD-2 | Estado Draft + fecha de alta + usuario creador | AC-001-02, AC-001-01 | Usuario creador fuera de alcance (C-001-09) |
| AC-01 | Tests xUnit | Claim creado con todos los campos | AC-001-01 | |
| AC-02 | Tests xUnit | Estado inicial Draft | AC-001-02 | |
| AC-03 | Tests xUnit | ID único generado | AC-001-03 | |
| AC-04 | Tests xUnit | Fecha no futura | AC-001-06a..e | |
| AC-05 | Tests xUnit | CP 5 dígitos | AC-001-07a, AC-001-07b | |
| AC-06 | Tests xUnit | Campos obligatorios | AC-001-04, AC-001-05 | |
| AC-07 | Tests xUnit | Múltiples errores | AC-001-09 | |
| AC-08 | Tests xUnit | Respuesta mapea todos los campos | AC-001-01 | |
| AC-09 | Tests xUnit | Persistencia y recuperación | AC-001-11a | |
| AC-10 | Tests xUnit | Null para ID inexistente | AC-001-11b | |
