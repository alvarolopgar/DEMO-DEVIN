---
spec: "002-alta-digital-cliente"
title: "Alta digital de cliente"
jira: "SPEC-002"
jira_aliases: []
status: "En revisión"
version: "1.0.0"
---

# 002 – Alta digital de cliente (SPEC-002)

> Solo **QUÉ** y **POR QUÉ**. Las decisiones técnicas están en [`plan.md`](plan.md).
> Clave canónica provisional: **SPEC-002** ([C-002-01](clarifications.md#c-002-01--clave-canónica-de-la-historia)).
> Esta spec se entrega **antes de implementar** (fases Specify → Tasks del flujo SDD); el gate de conformidad
> la trata como "spec sin implementación" hasta que `trace-map.json` mapee código o exista el primer test
> ([C-002-10](clarifications.md#c-002-10--gate-spec-conformance-antes-de-implementar)).

## 1. Contexto y objetivo

Una persona que quiere ser cliente del banco completa su alta de forma digital, sin acudir a una oficina:
informa sus datos personales, su documento de identidad, sus datos de contacto y los consentimientos
legales. El sistema valida los datos y registra la solicitud de alta en estado **PendienteVerificacion**
(pendiente de verificación de identidad). La verificación de identidad (selfie, videollamada, lectura NFC
del documento), la creación de las credenciales de acceso y la activación final del cliente se tratan en
historias posteriores.

## 2. Actores

- **Solicitante**: persona física mayor de edad que quiere darse de alta como cliente.

## 3. Alcance

### Dentro de alcance
- Pantalla de solicitud de alta con los datos obligatorios (§4).
- Validación de los datos (en la pantalla y en el servicio) con la misma semántica, incluidas la mayoría
  de edad y la letra de control del DNI/NIE.
- Registro de la solicitud de alta en estado PendienteVerificacion y confirmación con su identificador.
- Rechazo de una solicitud cuando ya existe otra registrada con el mismo documento de identidad.
- Acción única "Solicitar alta" ([C-002-05](clarifications.md#c-002-05--acciones-de-la-pantalla)).

### Fuera de alcance
- Verificación de la identidad del solicitante (selfie, videollamada, NFC, firma) y comprobación de la
  veracidad o vigencia real del documento ante organismos oficiales ([C-002-02](clarifications.md#c-002-02--verificación-real-de-la-identidad)).
- Transiciones de estado PendienteVerificacion → Verificada → ClienteCreado / Rechazada y demás del ciclo
  de vida; la máquina de estados completa se documenta como referencia en [`data-model.md`](data-model.md).
- Creación de credenciales de acceso (usuario/contraseña, OTP) y autenticación ([C-002-06](clarifications.md#c-002-06--credenciales-y-autenticación)).
- Consulta o recuperación de una solicitud por parte del solicitante (verificación KYC en curso).
- Guardar una solicitud incompleta para continuarla más tarde ([C-002-05](clarifications.md#c-002-05--acciones-de-la-pantalla)).
- Persistencia real en base de datos y gestión del expediente del cliente.
- Idempotencia en servidor ([C-002-07](clarifications.md#c-002-07--doble-envío-e-idempotencia)).

## 4. Requisitos funcionales

| ID | Requisito |
|---|---|
| REQ-002-01 | El sistema permite registrar una solicitud de alta con estos datos obligatorios: nombre, apellidos, tipo de documento, número de documento, fecha de nacimiento, correo electrónico y teléfono móvil. |
| REQ-002-02 | Un dato de texto vacío o formado solo por espacios en blanco se considera no informado y se rechaza con un mensaje asociado a ese campo. |
| REQ-002-03 | Toda solicitud de alta nueva se registra en estado **PendienteVerificacion**. El estado no lo elige el usuario y cualquier estado indicado en la petición se ignora. |
| REQ-002-04 | El solicitante debe ser mayor de edad el día del alta: su fecha de nacimiento debe ser anterior o igual a hoy menos 18 años. "Hoy" es la fecha civil vigente en la zona horaria de negocio **Europe/Madrid**; la comparación se hace por día natural, sin horas. |
| REQ-002-05 | Si el tipo de documento es DNI, el número tiene exactamente 8 dígitos seguidos de la letra de control correcta (la letra correspondiente al número módulo 23 sobre la serie "TRWAGMYFPDXBNJZSQVHLCKE"). |
| REQ-002-06 | Si el tipo de documento es NIE, el número tiene una letra inicial X, Y o Z seguida de 7 dígitos y la letra de control correcta (calculada sustituyendo X→0, Y→1, Z→2 y aplicando la misma serie del DNI). |
| REQ-002-07 | Si el tipo de documento es Pasaporte, el número solo se valida como obligatorio ([C-002-04](clarifications.md#c-002-04--formato-del-pasaporte)). |
| REQ-002-08 | El número de documento se normaliza antes de validar y de comparar (mayúsculas, sin espacios ni guiones). La normalización no modifica el resto de campos. |
| REQ-002-09 | El correo electrónico tiene un formato válido de dirección de correo. |
| REQ-002-10 | El teléfono móvil tiene exactamente 9 dígitos y empieza por 6 o por 7 ([C-002-03](clarifications.md#c-002-03--formato-del-teléfono)). |
| REQ-002-11 | El solicitante debe aceptar la política de protección de datos (RGPD) para poder solicitar el alta. El consentimiento de marketing es opcional y se registra como "no" si no se informa. |
| REQ-002-12 | Al registrar la solicitud se devuelve un identificador único, el estado, la fecha de alta y los datos registrados. |
| REQ-002-13 | Cuando hay varios datos inválidos se informan todos los errores a la vez, no solo el primero. |
| REQ-002-14 | Si los datos no son válidos, no se registra ninguna solicitud de alta. |
| REQ-002-15 | Una solicitud registrada queda guardada y es recuperable por su identificador. |
| REQ-002-16 | Si ya existe una solicitud registrada con el mismo tipo y número de documento (normalizado), la nueva solicitud se rechaza con el código de conflicto correspondiente. |
| REQ-002-17 | La pantalla comunica al solicitante el estado del proceso: edición, errores (por campo y del servicio), envío en curso, solicitud registrada y documento duplicado. |

## 5. Criterios de aceptación

### AC-002-01 – Alta correcta de una solicitud
REQ: REQ-002-01, REQ-002-12

```gherkin
Scenario: Registrar una solicitud con todos los datos válidos
  Given un solicitante que ha informado todos los datos obligatorios con valores válidos
  When solicita el alta
  Then la solicitud queda registrada
  And se devuelve su identificador, su estado, su fecha de alta y los mismos datos informados
```

### AC-002-02 – Estado inicial PendienteVerificacion
REQ: REQ-002-03

```gherkin
Scenario: El estado inicial es siempre PendienteVerificacion
  Given unos datos de solicitud válidos
  And la petición indica un estado distinto (por ejemplo "ClienteCreado")
  When se registra la solicitud
  Then el estado de la solicitud registrada es "PendienteVerificacion"
```

### AC-002-03 – Identificador único
REQ: REQ-002-12

```gherkin
Scenario: Cada solicitud recibe un identificador distinto
  Given dos o más solicitudes de alta válidas con documentos distintos
  When se registran
  Then cada solicitud tiene un identificador no vacío y distinto de las demás
```

### AC-002-04 – Datos obligatorios no informados
REQ: REQ-002-01, REQ-002-02

```gherkin
Scenario Outline: Rechazo cuando falta un dato obligatorio
  Given unos datos de solicitud válidos
  And el dato "<campo>" no está informado
  When se intenta registrar la solicitud
  Then se rechaza con el mensaje "<mensaje>" asociado al campo "<campo>"

  Examples:
    | campo                | mensaje                                       |
    | nombre               | El nombre es obligatorio.                     |
    | apellidos            | Los apellidos son obligatorios.               |
    | tipo de documento    | El tipo de documento es obligatorio.          |
    | número de documento  | El número de documento es obligatorio.        |
    | fecha de nacimiento  | La fecha de nacimiento es obligatoria.        |
    | correo electrónico   | El correo electrónico es obligatorio.         |
    | teléfono móvil       | El teléfono móvil es obligatorio.             |
```

### AC-002-05 – Texto formado solo por espacios
REQ: REQ-002-02

```gherkin
Scenario: Un texto con solo espacios, tabuladores o saltos de línea equivale a vacío
  Given unos datos de solicitud válidos
  And el nombre (o los apellidos) contiene solo espacios en blanco
  When se intenta registrar la solicitud
  Then se rechaza con el mensaje de dato obligatorio de ese campo
```

### AC-002-06a – Mayoría de edad cumplida hoy
REQ: REQ-002-04

```gherkin
Scenario: El solicitante cumple exactamente 18 años el día del alta
  Given el día actual en Europe/Madrid es D
  And la fecha de nacimiento es el mismo día y mes de hace 18 años
  When se registra la solicitud
  Then no hay error de fecha de nacimiento
```

### AC-002-06b – Cumple 18 años mañana
REQ: REQ-002-04

```gherkin
Scenario: El solicitante cumple 18 años al día siguiente del alta
  Given el día actual en Europe/Madrid es D
  And la fecha de nacimiento es el día D+1 de hace 18 años
  When se intenta registrar la solicitud
  Then se rechaza con el mensaje "Debes ser mayor de edad para darte de alta."
```

### AC-002-06c – Menor de edad
REQ: REQ-002-04

```gherkin
Scenario: Rechazo de un solicitante menor de edad
  Given la fecha de nacimiento corresponde a una persona de menos de 18 años
    (incluida cualquier fecha futura)
  When se intenta registrar la solicitud
  Then se rechaza con el mensaje "Debes ser mayor de edad para darte de alta."
```

### AC-002-06d – Nacimiento un 29 de febrero
REQ: REQ-002-04

```gherkin
Scenario: Quien nació un 29 de febrero cumple 18 años el 28 de febrero de un año no bisiesto
  Given el día actual en Europe/Madrid es 2026-02-28
  And la fecha de nacimiento es 2008-02-29
  When se registra la solicitud
  Then no hay error de fecha de nacimiento
```

### AC-002-07a – DNI válido
REQ: REQ-002-05

```gherkin
Scenario Outline: DNI con 8 dígitos y letra de control correcta
  Given el tipo de documento es DNI y el número es "<dni>"
  When se registra la solicitud
  Then no hay error de número de documento

  Examples:
    | dni       |
    | 12345678Z |
    | 00000001R |
    | 87654321X |
```

### AC-002-07b – DNI con letra de control incorrecta
REQ: REQ-002-05

```gherkin
Scenario: La letra no corresponde al número
  Given el tipo de documento es DNI y el número es "12345678A"
  When se intenta registrar la solicitud
  Then se rechaza con el mensaje "El número de documento no es válido."
```

### AC-002-07c – DNI con formato inválido
REQ: REQ-002-05

```gherkin
Scenario Outline: DNI que no sigue el patrón 8 dígitos + letra
  Given el tipo de documento es DNI y el número es "<dni>"
  When se intenta registrar la solicitud
  Then se rechaza con el mensaje "El número de documento no es válido."

  Examples:
    | dni       |
    | 1234567   |
    | 123456789 |
    | 12345678  |
    | 1234567Z  |
    | 1234A678Z |
    | 123456780 |
```

### AC-002-08a – NIE válido
REQ: REQ-002-06

```gherkin
Scenario Outline: NIE con X/Y/Z, 7 dígitos y letra de control correcta
  Given el tipo de documento es NIE y el número es "<nie>"
  When se registra la solicitud
  Then no hay error de número de documento

  Examples:
    | nie       |
    | X1234567L |
    | Z9876543A |
```

### AC-002-08b – NIE inválido
REQ: REQ-002-06

```gherkin
Scenario Outline: NIE con prefijo, longitud o letra de control incorrectos
  Given el tipo de documento es NIE y el número es "<nie>"
  When se intenta registrar la solicitud
  Then se rechaza con el mensaje "El número de documento no es válido."

  Examples:
    | nie       |
    | W1234567L |
    | X1234567A |
    | X123456L  |
    | X12345678 |
```

### AC-002-09 – Pasaporte solo obligatorio
REQ: REQ-002-07

```gherkin
Scenario Outline: Cualquier pasaporte informado es aceptado
  Given el tipo de documento es Pasaporte y el número es "<pasaporte>"
  When se registra la solicitud
  Then no hay error de número de documento

  Examples:
    | pasaporte   |
    | PAA123456   |
    | AA-123456-B |
```

### AC-002-10 – Normalización del número de documento
REQ: REQ-002-08

```gherkin
Scenario Outline: El documento se valida tras normalizarlo
  Given el tipo de documento es DNI y el número informado es "<entrada>"
  When se registra la solicitud
  Then no hay error de número de documento
  And el número registrado es "12345678Z"

  Examples:
    | entrada      |
    | 12345678z    |
    | 12345678 Z   |
    | 12345678-Z   |
    | "12345678Z " |
```

### AC-002-11a – Correo electrónico válido
REQ: REQ-002-09

```gherkin
Scenario Outline: Direcciones de correo con formato válido
  Given el correo electrónico es "<email>"
  When se registra la solicitud
  Then no hay error de correo electrónico

  Examples:
    | email                    |
    | cliente@example.com      |
    | nombre.apellido@banco.es |
    | cliente+tag@dominio.io   |
```

### AC-002-11b – Correo electrónico inválido
REQ: REQ-002-09

```gherkin
Scenario Outline: Direcciones de correo con formato inválido
  Given el correo electrónico es "<email>"
  When se intenta registrar la solicitud
  Then se rechaza con el mensaje "El correo electrónico no es válido."

  Examples:
    | email              |
    | cliente            |
    | cliente@           |
    | @dominio.com       |
    | cliente@dominio    |
    | cliente dominio.es |
```

### AC-002-12a – Teléfono móvil válido
REQ: REQ-002-10

```gherkin
Scenario Outline: Teléfono móvil de 9 dígitos que empieza por 6 o 7
  Given el teléfono móvil es "<telefono>"
  When se registra la solicitud
  Then no hay error de teléfono móvil

  Examples:
    | telefono  |
    | 612345678 |
    | 700123456 |
```

### AC-002-12b – Teléfono móvil inválido
REQ: REQ-002-10

```gherkin
Scenario Outline: Teléfono que no cumple el formato de móvil
  Given el teléfono móvil es "<telefono>"
  When se intenta registrar la solicitud
  Then se rechaza con el mensaje "El teléfono móvil debe tener 9 dígitos y empezar por 6 o 7."

  Examples:
    | telefono     |
    | 512345678    |
    | 912345678    |
    | 61234567     |
    | 6123456789   |
    | +34612345678 |
    | 61 234 56 78 |
```

### AC-002-13a – Consentimiento RGPD obligatorio
REQ: REQ-002-11

```gherkin
Scenario: No se registra la solicitud sin aceptar la política de protección de datos
  Given unos datos de solicitud válidos
  And el consentimiento RGPD no está aceptado
  When se intenta registrar la solicitud
  Then se rechaza con el mensaje "Debes aceptar la política de protección de datos."
```

### AC-002-13b – Consentimiento de marketing opcional
REQ: REQ-002-11

```gherkin
Scenario Outline: El consentimiento de marketing es opcional
  Given unos datos de solicitud válidos con RGPD aceptado
  And el consentimiento de marketing es "<marketing>"
  When se registra la solicitud
  Then la solicitud queda registrada con el consentimiento de marketing "<registrado>"

  Examples:
    | marketing   | registrado |
    | aceptado    | sí         |
    | no aceptado | no         |
    | no informado| no         |
```

### AC-002-14 – Todos los errores a la vez
REQ: REQ-002-13

```gherkin
Scenario: Varios datos inválidos generan todos sus errores simultáneamente
  Given varios datos obligatorios vacíos, una fecha de nacimiento de menor de edad
    y un correo electrónico inválido
  When se intenta registrar la solicitud
  Then se devuelven en una sola respuesta los errores de todos esos campos
```

### AC-002-15 – Datos inválidos no se registran
REQ: REQ-002-14

```gherkin
Scenario: Una solicitud rechazada no deja rastro
  Given unos datos de solicitud con al menos un error de validación
  When se intenta registrar la solicitud
  Then no se devuelve identificador y no se registra ninguna solicitud
```

### AC-002-16a – Solicitud recuperable por identificador
REQ: REQ-002-15

```gherkin
Scenario: La solicitud registrada se puede recuperar
  Given una solicitud registrada correctamente
  When se recupera por su identificador
  Then se obtiene la misma solicitud, en estado PendienteVerificacion
```

### AC-002-16b – Identificador inexistente
REQ: REQ-002-15

```gherkin
Scenario: Recuperar un identificador que no existe no devuelve nada
  Given un identificador que no corresponde a ninguna solicitud
  When se intenta recuperar
  Then no se obtiene ninguna solicitud
```

### AC-002-17a – Documento ya registrado
REQ: REQ-002-16, REQ-002-17

```gherkin
Scenario: Rechazo de una solicitud con un documento ya registrado
  Given una solicitud registrada con tipo de documento DNI y número "12345678Z"
  When se intenta registrar otra solicitud con el mismo tipo y número de documento
    (aunque el resto de datos sean distintos)
  Then se rechaza con el mensaje "Ya existe una solicitud de alta con ese documento de identidad."
  And no se registra una segunda solicitud
```

### AC-002-17b – Mismo número con otro tipo de documento
REQ: REQ-002-16

```gherkin
Scenario: El mismo número con distinto tipo de documento no es duplicado
  Given una solicitud registrada con tipo de documento Pasaporte y número "12345678Z"
  When se registra una solicitud válida con tipo DNI y número "12345678Z"
  Then la solicitud queda registrada
```

### AC-002-18 – Formato estándar de errores
REQ: REQ-002-13, REQ-002-16

```gherkin
Scenario: Los errores del servicio siguen el formato Problem Details (RFC 7807)
  Given una petición de alta con datos inválidos o con documento duplicado
  When se envía al servicio
  Then la respuesta tiene código 400 o 409 respectivamente
  And el cuerpo incluye title, status, detail y la lista de mensajes
  And la respuesta cumple el contrato publicado
```

### AC-002-19 – Envío en curso
REQ: REQ-002-17

```gherkin
Scenario: Mientras se registra la solicitud no se puede volver a enviar
  Given un solicitante que ha pulsado "Solicitar alta" con datos válidos
  When el servicio aún no ha respondido
  Then la pantalla muestra "Enviando solicitud..."
  And la acción "Solicitar alta" no está disponible
```

### AC-002-20 – Errores de validación en pantalla sin llamar al servicio
REQ: REQ-002-17, REQ-002-02, REQ-002-13

```gherkin
Scenario: El formulario muestra los errores por campo antes de enviar
  Given un solicitante en la pantalla de alta con campos obligatorios vacíos
  When pulsa "Solicitar alta"
  Then se muestran los mensajes de error junto a cada campo afectado
  And no se envía ninguna petición al servicio
```

### AC-002-21 – Errores devueltos por el servicio
REQ: REQ-002-17, REQ-002-13

```gherkin
Scenario: La pantalla muestra los errores devueltos por el servicio
  Given el servicio rechaza el alta con uno o varios mensajes de validación
    (o con conflicto de documento duplicado)
  When el solicitante envía el formulario
  Then la pantalla muestra cada mensaje devuelto por el servicio
```

### AC-002-22 – Confirmación de solicitud
REQ: REQ-002-17, REQ-002-12

```gherkin
Scenario: La pantalla confirma el registro con identificador y estado
  Given una solicitud de alta registrada correctamente
  When el servicio confirma el registro
  Then la pantalla muestra "Solicitud de alta registrada", el identificador
    y "Estado: PendienteVerificacion"
  And ofrece la acción "Volver al inicio"
```

## 6. Estados de interfaz

| ID | Estado | Descripción | AC |
|---|---|---|---|
| UI-002-01 | Default | Formulario de alta con las secciones Datos personales, Documento de identidad, Contacto y Consentimientos; todos los campos marcados como obligatorios salvo el consentimiento de marketing; acción "Solicitar alta". | AC-002-20 |
| UI-002-02 | Error | Mensajes por campo bajo cada campo inválido y/o avisos con los errores devueltos por el servicio. | AC-002-20, AC-002-21 |
| UI-002-03 | Loading | Indicador "Enviando solicitud..."; acciones no disponibles. | AC-002-19 |
| UI-002-04 | Success | "Solicitud de alta registrada", identificador, "Estado: PendienteVerificacion" y acción "Volver al inicio". | AC-002-22 |
| UI-002-05 | Duplicado | Aviso "Ya existe una solicitud de alta con ese documento de identidad." sobre el formulario, que conserva los datos introducidos. | AC-002-17a, AC-002-21 |

Diseños, mapa de frames Figma e identidad gráfica: [`ui/states.md`](ui/states.md) y [`ui/brand.md`](ui/brand.md).

## 7. Requisitos no funcionales (medibles)

| ID | Requisito | Métrica / umbral | Verificación |
|---|---|---|---|
| NFR-002-01 | Rendimiento del alta | p95 del registro de una solicitud < 300 ms con 20 peticiones/s sostenidas durante 60 s en el entorno de preproducción | Prueba de carga (pendiente de entorno, T-002-20) |
| NFR-002-02 | Errores estándar | 100 % de las respuestas de error (400, 409) en formato Problem Details (RFC 7807) | AC-002-18 (tests de contrato) |
| NFR-002-03 | Seguridad | 0 vulnerabilidades High/Critical (Snyk SCA) en dependencias de producción | Job CI `security` |
| NFR-002-04 | Accesibilidad | Todos los campos tienen etiqueta accesible y se marcan como obligatorios; contraste de color ≥ 4,5:1 con los tokens de `ui/brand.md`; objetivo WCAG 2.1 AA | Tests de UI por etiqueta; auditoría axe pendiente |
| NFR-002-05 | Contrato estable | El servicio cumple al 100 % el contrato `contracts/openapi.yaml`, que pasa el linter sin errores | Tests de contrato + job CI `spec-conformance` |
| NFR-002-06 | Validación dual coherente | Las reglas REQ-002-02, -04, -05, -06, -08, -09, -10 dan el mismo resultado en pantalla y en servicio para los mismos datos e instante | Tests AC-002-04..12 en backend y frontend |
| NFR-002-07 | Cobertura de aceptación | 100 % de los AC con ≥ 1 test automatizado; 0 tests con AC inexistente (aplica desde que la spec entra en implementación, C-002-10) | Job CI `spec-conformance` |
| NFR-002-08 | Protección de datos | El número de documento, el teléfono y el correo no se registran en logs ni telemetría (minimización RGPD) | Revisión de código + auditoría de logs (T-002-18) |
| NFR-002-09 | Identidad de marca | La interfaz usa los tokens de `ui/brand.md` extraídos de bancsabadell.com; ningún color o tipo de letra fuera de la paleta documentada | Revisión visual + tests de estilo (T-002-17) |

## 8. Casos límite

| ID | Caso | Comportamiento esperado | AC |
|---|---|---|---|
| EC-002-01 | Cumple 18 años el día del alta | Válido | AC-002-06a |
| EC-002-02 | Cumple 18 años al día siguiente | Inválido | AC-002-06b |
| EC-002-03 | Nacido un 29 de febrero; el 18.º aniversario cae en año no bisiesto | Cumple 18 el 28 de febrero | AC-002-06d |
| EC-002-04 | Documento en minúsculas, con espacios o con guiones ("12345678-z", "12 345 678z") | Se eliminan espacios y guiones y se pasa a mayúsculas antes de validar | AC-002-10 |
| EC-002-05 | DNI con ceros a la izquierda ("00000001R") | Válido si la letra corresponde | AC-002-07a |
| EC-002-06 | Teléfono con prefijo internacional o con espacios | Inválido (sin normalización) | AC-002-12b |
| EC-002-07 | La petición incluye un estado distinto de PendienteVerificacion | Se ignora; el estado es PendienteVerificacion | AC-002-02 |
| EC-002-08 | Doble clic en "Solicitar alta" | Solo se registra una solicitud: la acción no está disponible durante el envío | AC-002-19 |
| EC-002-09 | Misma solicitud repetida tras confirmación (documento ya registrado) | Rechazo 409 con aviso de documento duplicado | AC-002-17a |
| EC-002-10 | Mismo número de documento con distinto tipo | No es duplicado | AC-002-17b |
| EC-002-11 | Consentimiento de marketing no informado | Se registra como "no" | AC-002-13b |
| EC-002-12 | Fecha de nacimiento no informada en el servicio | Se rechaza con "La fecha de nacimiento es obligatoria." | AC-002-04 |
| EC-002-13 | Correo con espacios alrededor | Se valida sin los espacios de los extremos (trim); el resto de espacios lo invalida | AC-002-11b |
| EC-002-14 | Solicitante con fecha de nacimiento futura | Inválido (es menor de edad) | AC-002-06c |

## 9. Preguntas abiertas y decisiones

Ver [`clarifications.md`](clarifications.md). Decisiones provisionales pendientes de confirmación:
C-002-01, C-002-02, C-002-03, C-002-04, C-002-05, C-002-06, C-002-07, C-002-08, C-002-09, C-002-10.
