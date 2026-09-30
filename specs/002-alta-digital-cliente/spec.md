---
spec: "002-alta-digital-cliente"
title: "Alta digital de cliente"
status: "En revisión"
version: "1.1.0"
---

# 002 – Alta digital de cliente (SPEC-002)

> Solo **QUÉ** y **POR QUÉ**. Las decisiones técnicas están en [`plan.md`](plan.md).
> Clave provisional de trabajo: **SPEC-002** (no existe historia en un gestor externo).
> Esta spec se entrega con el diseño completo antes de implementar la funcionalidad; el gate de
> conformidad la trata como "spec en implementación" solo cuando `trace-map.json` mapee código o
> exista el primer test de AC ([C-002-10](clarifications.md#c-002-10--gate-spec-conformance-antes-de-implementar)).

## 1. Contexto y objetivo

Una persona que quiere ser cliente del banco completa su alta de forma digital, sin acudir a una
oficina: informa sus datos personales, su documento de identidad, sus datos de contacto y los
consentimientos legales. Puede **guardar la solicitud como borrador** con datos incompletos y
**reanudarla** más tarde por su identificador. Al enviarla, el sistema valida todos los datos y la
registra en estado **PendienteVerificacion**. A continuación un **proveedor de verificación de
identidad** comprueba al solicitante: si el resultado es positivo la solicitud pasa a **Verificada**
y el alta se completa creando el expediente del cliente (**ClienteCreado**); si es negativo pasa a
**Rechazada**. Las solicitudes abandonadas **caducan** (**Caducada**). En esta entrega el proveedor de
verificación es un componente sustituible con una implementación **dummy** determinista
([C-002-01](clarifications.md#c-002-01--verificación-de-la-identidad-del-solicitante)).

## 2. Actores

- **Solicitante**: persona física mayor de edad que quiere darse de alta como cliente.
- **Proveedor de verificación de identidad**: servicio externo (abstraído; dummy en esta entrega) que
  resuelve si la identidad declarada queda verificada o rechazada.

## 3. Alcance

### Dentro de alcance
- Pantalla de solicitud de alta con los datos obligatorios (§4) y acciones "Guardar borrador" y
  "Solicitar alta" ([C-002-04](clarifications.md#c-002-04--guardar-borrador-y-reanudar)).
- Guardado de una solicitud **incompleta** como borrador y su **reanudación** por identificador.
- Máquina de estados completa: Borrador → PendienteVerificacion → Verificada → ClienteCreado,
  Rechazada y Caducada, con las reglas de transición de [`data-model.md`](data-model.md).
- Verificación de la identidad del solicitante a través de un proveedor de verificación; en esta
  entrega, servicio **dummy** determinista que responde a las llamadas de verificación
  ([C-002-01](clarifications.md#c-002-01--verificación-de-la-identidad-del-solicitante)).
- Validación de los datos (en la pantalla y en el servicio) con la misma semántica, incluidas la
  mayoría de edad y la letra de control del DNI/NIE.
- Rechazo del envío cuando ya existe otra solicitud **activa** con el mismo documento de identidad.

### Fuera de alcance
- Proveedor real de verificación de identidad (selfie, videollamada, lectura NFC, firma,
  comprobación de veracidad o vigencia del documento ante organismos oficiales). La interfaz del
  proveedor queda definida y el dummy es sustituible
  ([C-002-01](clarifications.md#c-002-01--verificación-de-la-identidad-del-solicitante)).
- Creación de credenciales de acceso (usuario/contraseña, OTP) y autenticación: ClienteCreado significa
  expediente de cliente creado, no acceso a la banca digital
  ([C-002-05](clarifications.md#c-002-05--credenciales-y-autenticación)).
- Persistencia real en base de datos y gestión del expediente del cliente.
- Idempotencia en servidor ([C-002-06](clarifications.md#c-002-06--doble-envío-e-idempotencia)).

## 4. Requisitos funcionales

| ID | Requisito |
|---|---|
| REQ-002-01 | El sistema permite registrar una solicitud de alta con estos datos obligatorios: nombre, apellidos, tipo de documento, número de documento, fecha de nacimiento, correo electrónico y teléfono móvil. |
| REQ-002-02 | Un dato de texto vacío o formado solo por espacios en blanco se considera no informado y se rechaza con un mensaje asociado a ese campo. |
| REQ-002-03 | Toda solicitud nueva se crea en estado **Borrador**. El estado no lo elige el usuario y cualquier estado indicado en la petición se ignora. |
| REQ-002-04 | El solicitante debe ser mayor de edad el día del envío del alta: su fecha de nacimiento debe ser anterior o igual a hoy menos 18 años. "Hoy" es la fecha civil vigente en la zona horaria de negocio **Europe/Madrid**; la comparación se hace por día natural, sin horas. |
| REQ-002-05 | Si el tipo de documento es DNI, el número tiene exactamente 8 dígitos seguidos de la letra de control correcta (la letra correspondiente al número módulo 23 sobre la serie "TRWAGMYFPDXBNJZSQVHLCKE"). |
| REQ-002-06 | Si el tipo de documento es NIE, el número tiene una letra inicial X, Y o Z seguida de 7 dígitos y la letra de control correcta (calculada sustituyendo X→0, Y→1, Z→2 y aplicando la misma serie del DNI). |
| REQ-002-07 | Si el tipo de documento es Pasaporte, el número solo se valida como obligatorio ([C-002-03](clarifications.md#c-002-03--formato-del-pasaporte)). |
| REQ-002-08 | El número de documento se normaliza antes de validar y de comparar (mayúsculas, sin espacios ni guiones). La normalización no modifica el resto de campos. |
| REQ-002-09 | El correo electrónico tiene un formato válido de dirección de correo. |
| REQ-002-10 | El teléfono móvil tiene exactamente 9 dígitos y empieza por 6 o por 7 ([C-002-02](clarifications.md#c-002-02--formato-del-teléfono)). |
| REQ-002-11 | El solicitante debe aceptar la política de protección de datos (RGPD) para poder enviar el alta. El consentimiento de marketing es opcional y se registra como "no" si no se informa. |
| REQ-002-12 | En todas las operaciones sobre la solicitud se devuelve su identificador único, su estado, sus fechas (creación, modificación y, si procede, envío y caducidad) y los datos registrados. |
| REQ-002-13 | Cuando hay varios datos inválidos se informan todos los errores a la vez, no solo el primero. |
| REQ-002-14 | Si los datos no son válidos al enviar, la solicitud permanece en Borrador y no cambia de estado. |
| REQ-002-15 | Toda solicitud queda guardada y es recuperable por su identificador, en cualquier estado, lo que permite reanudar un borrador o consultar su resultado. |
| REQ-002-16 | Solo puede existir una solicitud **activa** (PendienteVerificacion, Verificada o ClienteCreado) por tipo y número de documento normalizado. Los estados Borrador, Rechazada y Caducada no bloquean ([C-002-07](clarifications.md#c-002-07--duplicado-de-documento-código-de-respuesta)). |
| REQ-002-17 | La pantalla comunica al solicitante el estado del proceso: edición, errores (por campo y del servicio), envío en curso, borrador guardado, reanudación, solicitud enviada, resultado de la verificación, alta completada y solicitud caducada o duplicada. |
| REQ-002-18 | El sistema permite guardar una solicitud incompleta como **borrador** con cualquier subconjunto de los datos (incluso vacío), sin aplicar validación de negocio. |
| REQ-002-19 | Un borrador se puede modificar mientras siga en estado Borrador; cada modificación actualiza su fecha de modificación. |
| REQ-002-20 | Al enviar la solicitud se aplican todas las validaciones (REQ-002-01..-11, REQ-002-13) y pasa a **PendienteVerificacion**. |
| REQ-002-21 | El sistema verifica la identidad del solicitante mediante un proveedor de verificación, sobre el documento y los datos personales informados. |
| REQ-002-22 | Si la verificación es satisfactoria la solicitud pasa a **Verificada**; si es negativa pasa a **Rechazada** registrando el motivo devuelto por el proveedor. |
| REQ-002-23 | Con la identidad verificada, el sistema completa el alta creando el expediente del cliente y la solicitud pasa a **ClienteCreado**. |
| REQ-002-24 | Una solicitud en Borrador caduca a los **30 días** de su creación y una en PendienteVerificacion a los 30 días de su envío, pasando a **Caducada**. Una solicitud Caducada no admite modificaciones ni más transiciones ([C-002-08](clarifications.md#c-002-08--caducidad-de-las-solicitudes)). |
| REQ-002-25 | Solo son válidas las transiciones de estado documentadas en [`data-model.md`](data-model.md); cualquier operación incompatible con el estado actual se rechaza con el código de conflicto correspondiente. |

## 5. Criterios de aceptación

### AC-002-01 – Alta correcta de una solicitud
REQ: REQ-002-01, REQ-002-12, REQ-002-20

```gherkin
Scenario: Enviar una solicitud con todos los datos válidos
  Given un borrador con todos los datos obligatorios informados con valores válidos
  When se envía la solicitud
  Then la solicitud queda registrada en estado PendienteVerificacion
  And se devuelve su identificador, su estado, sus fechas y los mismos datos informados
```

### AC-002-02 – El estado no lo elige el usuario
REQ: REQ-002-03, REQ-002-20

```gherkin
Scenario: El estado inicial es siempre Borrador
  Given unos datos de solicitud válidos
  And la petición indica un estado distinto (por ejemplo "ClienteCreado")
  When se crea la solicitud
  Then el estado de la solicitud creada es "Borrador"
  And al enviarla pasa a "PendienteVerificacion"
```

### AC-002-03 – Identificador único
REQ: REQ-002-12

```gherkin
Scenario: Cada solicitud recibe un identificador distinto
  Given dos o más solicitudes de alta con documentos distintos
  When se crean
  Then cada solicitud tiene un identificador no vacío y distinto de las demás
```

### AC-002-04 – Datos obligatorios no informados
REQ: REQ-002-01, REQ-002-02

```gherkin
Scenario Outline: Rechazo cuando falta un dato obligatorio
  Given un borrador con los datos válidos
  And el dato "<campo>" no está informado
  When se intenta enviar la solicitud
  Then se rechaza con el mensaje "<mensaje>" asociado al campo "<campo>"
  And la solicitud permanece en estado Borrador

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
  Given un borrador con los datos válidos
  And el nombre (o los apellidos) contiene solo espacios en blanco
  When se intenta enviar la solicitud
  Then se rechaza con el mensaje de dato obligatorio de ese campo
```

### AC-002-06a – Mayoría de edad cumplida hoy
REQ: REQ-002-04

```gherkin
Scenario: El solicitante cumple exactamente 18 años el día del envío
  Given el día actual en Europe/Madrid es D
  And la fecha de nacimiento es el mismo día y mes de hace 18 años
  When se envía la solicitud
  Then no hay error de fecha de nacimiento
```

### AC-002-06b – Cumple 18 años mañana
REQ: REQ-002-04

```gherkin
Scenario: El solicitante cumple 18 años al día siguiente del envío
  Given el día actual en Europe/Madrid es D
  And la fecha de nacimiento es el día D+1 de hace 18 años
  When se intenta enviar la solicitud
  Then se rechaza con el mensaje "Debes ser mayor de edad para darte de alta."
```

### AC-002-06c – Menor de edad
REQ: REQ-002-04

```gherkin
Scenario: Rechazo de un solicitante menor de edad
  Given la fecha de nacimiento corresponde a una persona de menos de 18 años
    (incluida cualquier fecha futura)
  When se intenta enviar la solicitud
  Then se rechaza con el mensaje "Debes ser mayor de edad para darte de alta."
```

### AC-002-06d – Nacimiento un 29 de febrero
REQ: REQ-002-04

```gherkin
Scenario: Quien nació un 29 de febrero cumple 18 años el 28 de febrero de un año no bisiesto
  Given el día actual en Europe/Madrid es 2026-02-28
  And la fecha de nacimiento es 2008-02-29
  When se envía la solicitud
  Then no hay error de fecha de nacimiento
```

### AC-002-07a – DNI válido
REQ: REQ-002-05

```gherkin
Scenario Outline: DNI con 8 dígitos y letra de control correcta
  Given el tipo de documento es DNI y el número es "<dni>"
  When se envía la solicitud
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
  When se intenta enviar la solicitud
  Then se rechaza con el mensaje "El número de documento no es válido."
```

### AC-002-07c – DNI con formato inválido
REQ: REQ-002-05

```gherkin
Scenario Outline: DNI que no sigue el patrón 8 dígitos + letra
  Given el tipo de documento es DNI y el número es "<dni>"
  When se intenta enviar la solicitud
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
  When se envía la solicitud
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
  When se intenta enviar la solicitud
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
  When se envía la solicitud
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
  When se envía la solicitud
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
  When se envía la solicitud
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
  When se intenta enviar la solicitud
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
  When se envía la solicitud
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
  When se intenta enviar la solicitud
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
Scenario: No se puede enviar la solicitud sin aceptar la política de protección de datos
  Given un borrador con los datos válidos
  And el consentimiento RGPD no está aceptado
  When se intenta enviar la solicitud
  Then se rechaza con el mensaje "Debes aceptar la política de protección de datos."
```

### AC-002-13b – Consentimiento de marketing opcional
REQ: REQ-002-11

```gherkin
Scenario Outline: El consentimiento de marketing es opcional
  Given un borrador con los datos válidos y RGPD aceptado
  And el consentimiento de marketing es "<marketing>"
  When se envía la solicitud
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
  Given un borrador con varios datos obligatorios vacíos, una fecha de nacimiento de menor de edad
    y un correo electrónico inválido
  When se intenta enviar la solicitud
  Then se devuelven en una sola respuesta los errores de todos esos campos
```

### AC-002-15 – Datos inválidos no se envían
REQ: REQ-002-14

```gherkin
Scenario: Una solicitud rechazada permanece en Borrador
  Given un borrador con al menos un error de validación
  When se intenta enviar la solicitud
  Then el estado sigue siendo Borrador y no se produce ninguna transición
```

### AC-002-16a – Solicitud recuperable por identificador
REQ: REQ-002-15

```gherkin
Scenario: La solicitud se puede recuperar en cualquier estado
  Given una solicitud creada o enviada correctamente
  When se recupera por su identificador
  Then se obtiene la misma solicitud con su estado y datos actuales
```

### AC-002-16b – Identificador inexistente
REQ: REQ-002-15

```gherkin
Scenario: Recuperar un identificador que no existe devuelve no encontrado
  Given un identificador que no corresponde a ninguna solicitud
  When se intenta recuperar
  Then la respuesta es "no encontrado" (404)
```

### AC-002-17a – Documento con solicitud activa
REQ: REQ-002-16, REQ-002-17

```gherkin
Scenario: Rechazo al enviar una solicitud con un documento con solicitud activa
  Given una solicitud enviada con tipo de documento DNI y número "12345678Z"
  When se intenta enviar otra solicitud con el mismo tipo y número de documento
    (aunque el resto de datos sean distintos)
  Then se rechaza con el mensaje "Ya existe una solicitud de alta con ese documento de identidad."
  And no se registra una segunda solicitud activa
```

### AC-002-17b – Mismo número con otro tipo de documento
REQ: REQ-002-16

```gherkin
Scenario: El mismo número con distinto tipo de documento no es duplicado
  Given una solicitud enviada con tipo de documento Pasaporte y número "12345678Z"
  When se envía una solicitud válida con tipo DNI y número "12345678Z"
  Then la solicitud queda registrada en PendienteVerificacion
```

### AC-002-18 – Formato estándar de errores
REQ: REQ-002-13, REQ-002-16, REQ-002-25

```gherkin
Scenario: Los errores del servicio siguen el formato Problem Details (RFC 7807)
  Given una petición con datos inválidos, documento duplicado, identificador inexistente
    o transición inválida
  When se envía al servicio
  Then la respuesta tiene código 400, 409 o 404 según corresponda
  And el cuerpo incluye title, status, detail y la lista de mensajes
  And la respuesta cumple el contrato publicado
```

### AC-002-19 – Envío en curso
REQ: REQ-002-17

```gherkin
Scenario: Mientras se envía la solicitud no se puede volver a enviar
  Given un solicitante que ha pulsado "Solicitar alta" con datos válidos
  When el servicio aún no ha respondido
  Then la pantalla muestra "Enviando solicitud..."
  And las acciones "Solicitar alta" y "Guardar borrador" no están disponibles
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
    (o con conflicto de documento duplicado o de transición inválida)
  When el solicitante envía el formulario
  Then la pantalla muestra cada mensaje devuelto por el servicio
```

### AC-002-22 – Confirmación de envío
REQ: REQ-002-17, REQ-002-12

```gherkin
Scenario: La pantalla confirma el envío con identificador y estado
  Given una solicitud de alta enviada correctamente
  When el servicio confirma el registro
  Then la pantalla muestra "Solicitud de alta registrada", el identificador
    y "Estado: PendienteVerificacion"
  And ofrece la acción "Verificar identidad"
```

### AC-002-23 – Guardar borrador incompleto
REQ: REQ-002-18, REQ-002-12

```gherkin
Scenario: Se puede guardar un borrador con cualquier subconjunto de datos
  Given un solicitante que ha informado solo el nombre "María" y el documento "12345678Z"
  When pulsa "Guardar borrador"
  Then la solicitud se crea en estado Borrador sin errores de validación
  And se devuelve el identificador de la solicitud
  And la pantalla muestra "Borrador guardado" con el identificador
```

### AC-002-24 – Modificar un borrador
REQ: REQ-002-19, REQ-002-15

```gherkin
Scenario: Un borrador se puede actualizar conservando su estado
  Given una solicitud en estado Borrador
  When se modifican uno o varios datos del borrador
  Then los datos quedan actualizados
  And el estado sigue siendo Borrador
  And la fecha de modificación se actualiza
```

### AC-002-25 – Enviar un borrador incompleto
REQ: REQ-002-20, REQ-002-13, REQ-002-14

```gherkin
Scenario: Enviar un borrador con datos incompletos devuelve todos los errores
  Given una solicitud en estado Borrador con datos obligatorios sin informar o inválidos
  When se intenta enviar la solicitud
  Then se devuelven todos los errores de validación
  And la solicitud permanece en estado Borrador
```

### AC-002-26 – Reanudar un borrador
REQ: REQ-002-15, REQ-002-17

```gherkin
Scenario: El borrador se recupera con sus datos para continuar el alta
  Given un borrador guardado con datos parciales
  When el solicitante lo recupera por su identificador
  Then la pantalla muestra el formulario precargado con los datos guardados
  And puede completar los datos restantes y enviar la solicitud
```

### AC-002-27 – Verificación de identidad satisfactoria
REQ: REQ-002-21, REQ-002-22

```gherkin
Scenario: El proveedor verifica la identidad del solicitante
  Given una solicitud en estado PendienteVerificacion con un documento válido
  When se solicita la verificación de identidad
  Then la solicitud pasa a estado Verificada
  And se registra el instante de verificación
```

### AC-002-28 – Verificación de identidad rechazada
REQ: REQ-002-21, REQ-002-22

```gherkin
Scenario: El proveedor rechaza la verificación
  Given una solicitud en estado PendienteVerificacion cuyo documento normalizado
    empieza por "99" (convención del proveedor dummy, C-002-01)
  When se solicita la verificación de identidad
  Then la solicitud pasa a estado Rechazada
  And se registra el motivo devuelto por el proveedor
```

### AC-002-29 – Alta completada
REQ: REQ-002-23

```gherkin
Scenario: Con la identidad verificada se completa el alta del cliente
  Given una solicitud en estado Verificada
  When se completa el alta
  Then se crea el expediente del cliente
  And la solicitud pasa a estado ClienteCreado
```

### AC-002-30 – Caducidad de un borrador
REQ: REQ-002-24

```gherkin
Scenario: Un borrador abandonado caduca a los 30 días
  Given una solicitud en estado Borrador creada hace más de 30 días
  When se accede a la solicitud
  Then su estado es Caducada
  And no admite modificación ni envío
```

### AC-002-31 – Caducidad pendiente de verificación
REQ: REQ-002-24

```gherkin
Scenario: Una solicitud sin verificar caduca a los 30 días del envío
  Given una solicitud en estado PendienteVerificacion enviada hace más de 30 días
  When se accede a la solicitud
  Then su estado es Caducada
  And no admite verificación
```

### AC-002-32 – Transiciones inválidas
REQ: REQ-002-25

```gherkin
Scenario Outline: Una operación incompatible con el estado actual se rechaza
  Given una solicitud en estado "<estado>"
  When se invoca la operación "<operacion>"
  Then se rechaza con el código de conflicto (409)
  And el estado no cambia

  Examples:
    | estado                | operacion          |
    | PendienteVerificacion | modificar datos    |
    | Borrador              | verificar identidad|
    | PendienteVerificacion | completar el alta  |
    | PendienteVerificacion | enviar de nuevo    |
    | Rechazada             | modificar datos    |
    | Caducada              | enviar             |
    | ClienteCreado         | cualquiera         |
```

### AC-002-33 – Dos borradores con el mismo documento
REQ: REQ-002-16, REQ-002-18

```gherkin
Scenario: Los borradores no bloquean; el bloqueo se aplica al enviar
  Given un borrador con tipo DNI y número "12345678Z"
  When se guarda otro borrador con el mismo tipo y número
  Then ambos borradores existen
  And cuando la primera solicitud se envía y queda activa
    la segunda recibe conflicto (409) al enviarse
```

### AC-002-34 – Solicitud Rechazada o Caducada no bloquea
REQ: REQ-002-16

```gherkin
Scenario Outline: Un documento con solicitud terminada permite un nuevo alta
  Given una solicitud en estado "<estado>" con tipo DNI y número "12345678Z"
  When se envía una nueva solicitud válida con el mismo documento
  Then la nueva solicitud queda registrada en PendienteVerificacion

  Examples:
    | estado    |
    | Rechazada |
    | Caducada  |
```

## 6. Estados de interfaz

| ID | Estado | Descripción | AC |
|---|---|---|---|
| UI-002-01 | Default | Formulario de alta con las secciones Datos personales, Documento de identidad, Contacto y Consentimientos; acciones "Guardar borrador" (secundaria) y "Solicitar alta" (primaria). | AC-002-20 |
| UI-002-02 | Error | Mensajes por campo bajo cada campo inválido y/o avisos con los errores devueltos por el servicio. | AC-002-20, AC-002-21 |
| UI-002-03 | Loading | Indicador "Enviando solicitud..."; acciones no disponibles. | AC-002-19 |
| UI-002-04 | Enviada | "Solicitud de alta registrada", identificador, "Estado: PendienteVerificacion" y acción "Verificar identidad". | AC-002-22 |
| UI-002-05 | Duplicado | Aviso "Ya existe una solicitud de alta con ese documento de identidad." sobre el formulario, que conserva los datos introducidos. | AC-002-17a, AC-002-21 |
| UI-002-06 | Borrador guardado | Aviso "Borrador guardado", identificador de la solicitud y acción "Continuar más tarde"; el formulario permanece editable. | AC-002-23 |
| UI-002-07 | Reanudación | Formulario precargado con los datos del borrador recuperado por identificador. | AC-002-26 |
| UI-002-08 | Verificada | "Identidad verificada correctamente" y acción "Completar alta". | AC-002-27 |
| UI-002-09 | Rechazada | "No hemos podido verificar tu identidad" con el motivo devuelto por el proveedor y acción "Volver al inicio". | AC-002-28 |
| UI-002-10 | Completada | "¡Ya eres cliente!", identificador y "Estado: ClienteCreado". | AC-002-29 |
| UI-002-11 | Caducada | "La solicitud ha caducado" y acción para iniciar un alta nueva. | AC-002-30, AC-002-31 |

Diseños, mapa de frames Figma e identidad gráfica: [`ui/states.md`](ui/states.md) y [`ui/brand.md`](ui/brand.md).

## 7. Requisitos no funcionales (medibles)

| ID | Requisito | Métrica / umbral | Verificación |
|---|---|---|---|
| NFR-002-01 | Rendimiento del alta | p95 del envío de una solicitud < 300 ms con 20 peticiones/s sostenidas durante 60 s en el entorno de preproducción | Prueba de carga (pendiente de entorno, T-002-20) |
| NFR-002-02 | Errores estándar | 100 % de las respuestas de error (400, 404, 409) en formato Problem Details (RFC 7807) | AC-002-18 (tests de contrato) |
| NFR-002-03 | Seguridad | 0 vulnerabilidades High/Critical (Snyk SCA) en dependencias de producción | Job CI `security` |
| NFR-002-04 | Accesibilidad | Todos los campos tienen etiqueta accesible y se marcan como obligatorios; contraste de color ≥ 4,5:1 con los tokens de `ui/brand.md`; objetivo WCAG 2.1 AA | Tests de UI por etiqueta; auditoría axe pendiente |
| NFR-002-05 | Contrato estable | El servicio cumple al 100 % el contrato `contracts/openapi.yaml`, que pasa el linter sin errores | Tests de contrato + job CI `spec-conformance` |
| NFR-002-06 | Validación dual coherente | Las reglas REQ-002-02, -04, -05, -06, -08, -09, -10 dan el mismo resultado en pantalla y en servicio para los mismos datos e instante | Tests AC-002-04..12 en backend y frontend |
| NFR-002-07 | Cobertura de aceptación | 100 % de los AC con ≥ 1 test automatizado; 0 tests con AC inexistente (aplica desde que la spec entra en implementación, C-002-10) | Job CI `spec-conformance` |
| NFR-002-08 | Protección de datos | El número de documento, el teléfono y el correo no se registran en logs ni telemetría (minimización RGPD) | Revisión de código + auditoría de logs (T-002-18) |
| NFR-002-09 | Identidad de marca | La interfaz usa los tokens de `ui/brand.md` extraídos de bancsabadell.com; ningún color o tipo de letra fuera de la paleta documentada | Revisión visual + tests de estilo (T-002-17) |
| NFR-002-10 | Verificación de identidad desacoplada | La verificación se resuelve a través de la interfaz del proveedor (`IIdentityVerificationService`); el dummy responde de forma determinista e inmediata, y un fallo del proveedor deja la solicitud en PendienteVerificacion | Tests del proveedor dummy + revisión de código |

## 8. Casos límite

| ID | Caso | Comportamiento esperado | AC |
|---|---|---|---|
| EC-002-01 | Cumple 18 años el día del envío | Válido | AC-002-06a |
| EC-002-02 | Cumple 18 años al día siguiente | Inválido | AC-002-06b |
| EC-002-03 | Nacido un 29 de febrero; el 18.º aniversario cae en año no bisiesto | Cumple 18 el 28 de febrero | AC-002-06d |
| EC-002-04 | Documento en minúsculas, con espacios o con guiones ("12345678-z", "12 345 678z") | Se eliminan espacios y guiones y se pasa a mayúsculas antes de validar | AC-002-10 |
| EC-002-05 | DNI con ceros a la izquierda ("00000001R") | Válido si la letra corresponde | AC-002-07a |
| EC-002-06 | Teléfono con prefijo internacional o con espacios | Inválido (sin normalización) | AC-002-12b |
| EC-002-07 | La petición incluye un estado distinto del esperado | Se ignora; el estado lo decide el sistema | AC-002-02 |
| EC-002-08 | Doble clic en "Solicitar alta" | Solo se envía una vez: la acción no está disponible durante el envío | AC-002-19 |
| EC-002-09 | Misma solicitud repetida tras envío (documento con solicitud activa) | Rechazo 409 con aviso de documento duplicado | AC-002-17a |
| EC-002-10 | Mismo número de documento con distinto tipo | No es duplicado | AC-002-17b |
| EC-002-11 | Consentimiento de marketing no informado | Se registra como "no" | AC-002-13b |
| EC-002-12 | Fecha de nacimiento no informada al enviar | Se rechaza con "La fecha de nacimiento es obligatoria." | AC-002-04 |
| EC-002-13 | Correo con espacios alrededor | Se valida sin los espacios de los extremos (trim); el resto de espacios lo invalida | AC-002-11b |
| EC-002-14 | Solicitante con fecha de nacimiento futura | Inválido (es menor de edad) | AC-002-06c |
| EC-002-15 | Borrador con todos los campos vacíos | Se guarda en Borrador sin errores | AC-002-23 |
| EC-002-16 | Enviar un borrador incompleto | 400 con todos los errores; permanece Borrador | AC-002-25 |
| EC-002-17 | Dos borradores con el mismo documento | Coexisten; el bloqueo actúa al enviar | AC-002-33 |
| EC-002-18 | Documento de una solicitud Rechazada o Caducada | No bloquea un nuevo alta | AC-002-34 |
| EC-002-19 | Operación incompatible con el estado (modificar una enviada, verificar un borrador, completar sin verificar) | 409, el estado no cambia | AC-002-32 |
| EC-002-20 | Reanudar una solicitud caducada | Se muestra como Caducada; no editable | AC-002-30 |
| EC-002-21 | Documento normalizado que empieza por "99" (convención del dummy) | Verificación rechazada | AC-002-28 |
| EC-002-22 | El proveedor de verificación falla o no responde | Error técnico; la solicitud permanece PendienteVerificacion | NFR-002-10 |

## 9. Preguntas abiertas y decisiones

Ver [`clarifications.md`](clarifications.md). Decisiones provisionales pendientes de confirmación:
C-002-01, C-002-02, C-002-03, C-002-04, C-002-05, C-002-06, C-002-07, C-002-08, C-002-09, C-002-10.
