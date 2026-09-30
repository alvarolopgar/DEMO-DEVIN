# Estados de interfaz – 002 Alta digital de cliente (SPEC-002)

Identidad gráfica: [`ui/brand.md`](brand.md) (tokens extraídos de bancsabadell.com, C-002-09).
Archivo Figma: [Devin-demo-Figma](https://www.figma.com/design/EDlAb7RBmlokWehf8kUdmB/Devin-demo-Figma) · página prevista **"SPEC-002 – Alta digital de cliente"**.
Implementación prevista: `src/components/OnboardingForm.tsx` (ruta `/onboarding/new`).

## Mapeo UI-ID → frame Figma

| UI | Estado | Frame Figma | AC |
|---|---|---|---|
| UI-002-01 | Default | _pendiente de crear (T-002-16)_ | AC-002-20 |
| UI-002-02 | Error | _pendiente de crear (T-002-16)_ | AC-002-20, AC-002-21 |
| UI-002-03 | Loading | _pendiente de crear (T-002-16)_ | AC-002-19 |
| UI-002-04 | Enviada | _pendiente de crear (T-002-16)_ | AC-002-22 |
| UI-002-05 | Duplicado | _pendiente de crear (T-002-16)_ | AC-002-17a, AC-002-21 |
| UI-002-06 | Borrador guardado | _pendiente de crear (T-002-16)_ | AC-002-23 |
| UI-002-07 | Reanudación | _pendiente de crear (T-002-16)_ | AC-002-26 |
| UI-002-08 | Verificada | _pendiente de crear (T-002-16)_ | AC-002-27 |
| UI-002-09 | Rechazada | _pendiente de crear (T-002-16)_ | AC-002-28 |
| UI-002-10 | Completada | _pendiente de crear (T-002-16)_ | AC-002-29 |
| UI-002-11 | Caducada | _pendiente de crear (T-002-16)_ | AC-002-30, AC-002-31 |

**Frames pendientes.** Aún no existen los frames de esta página en el archivo Figma; el nombre objetivo
de cada frame es `<UI-ID> <Estado>` (p. ej. `UI-002-01 Default`). La API REST de Figma no permite crear
ni renombrar nodos (requiere plugin o edición manual), así que se crearán en la fase Design del flujo SDD;
hasta entonces, esta tabla es el mapeo oficial.

## UI-002-01 – Default

- Cabecera con la marca (ver `brand.md`), título "Hazte cliente" y texto de apoyo
  "Completa tu alta digital en unos minutos".
- Sección **Datos personales**: Nombre*, Apellidos*, Fecha de nacimiento*.
- Sección **Documento de identidad**: Tipo de documento* (DNI, NIE, Pasaporte; por defecto DNI),
  Número de documento*.
- Sección **Contacto**: Correo electrónico*, Teléfono móvil*.
- Sección **Consentimientos**: casilla obligatoria "He leído y acepto la política de protección de
  datos" y casilla opcional "Quiero recibir comunicaciones comerciales" (REQ-002-11).
- Dos acciones: **"Solicitar alta"** (primaria, azul de marca) y **"Guardar borrador"** (secundaria).
  Leyenda bajo las acciones: "Puedes guardar tu solicitud y continuarla más tarde."

## UI-002-02 – Error

- Validación en pantalla (AC-002-20): mensaje bajo cada campo inválido; no se llama al servicio.
- Errores del servicio (AC-002-21): un aviso de error por cada mensaje devuelto; si no hay conexión,
  "Error de conexión. Inténtelo de nuevo.".
- El formulario conserva los valores introducidos.

## UI-002-03 – Loading

- Spinner con el texto "Enviando solicitud..." (AC-002-19).
- El formulario y las acciones no se muestran, lo que evita envíos duplicados (EC-002-08).

## UI-002-04 – Enviada

- Icono de confirmación, "Solicitud de alta registrada", "ID: <uuid>" y
  "Estado: PendienteVerificacion" (AC-002-22).
- Texto informativo del siguiente paso: "El siguiente paso es verificar tu identidad."
- Acción "Verificar identidad", que invoca `POST /{id}/verify` y lleva a UI-002-08 o UI-002-09.

## UI-002-05 – Duplicado

- Aviso de error persistente "Ya existe una solicitud de alta con ese documento de identidad."
  (AC-002-17a) sobre el formulario, con el foco en el campo Número de documento.
- El formulario conserva los valores introducidos y la acción "Solicitar alta" vuelve a estar
  disponible para corregir el dato.

## UI-002-06 – Borrador guardado

- Aviso informativo "Borrador guardado" con el identificador de la solicitud (AC-002-23) y texto
  "Puedes continuar tu alta más tarde con este identificador."
- Acción "Continuar más tarde", que sale de la pantalla conservando el borrador.
- El formulario permanece editable con los datos introducidos.

## UI-002-07 – Reanudación

- Entrada "Continuar con mi solicitud" que pide el identificador del borrador.
- Tras `GET /{id}`, el formulario (UI-002-01) se muestra **precargado** con los datos guardados
  (AC-002-26); si el identificador no existe, error "No existe ninguna solicitud con ese
  identificador."; si caducó, UI-002-11.

## UI-002-08 – Verificada

- Icono de confirmación y mensaje "Identidad verificada correctamente" (AC-002-27).
- Acción "Completar alta", que invoca `POST /{id}/complete` y lleva a UI-002-10.

## UI-002-09 – Rechazada

- Aviso "No hemos podido verificar tu identidad" con el motivo devuelto por el proveedor
  (AC-002-28) y texto "Puedes iniciar un alta nueva si lo deseas."
- Acción "Volver al inicio".

## UI-002-10 – Completada

- Icono de confirmación, "¡Ya eres cliente!", "ID: <uuid>" y "Estado: ClienteCreado" (AC-002-29).
- Acción "Volver al inicio".

## UI-002-11 – Caducada

- Aviso "La solicitud ha caducado" (AC-002-30, AC-002-31) con texto "Inicia una nueva solicitud de
  alta." y acción "Volver al inicio".

## Transiciones

```mermaid
stateDiagram-v2
    [*] --> Default
    [*] --> Reanudacion: Continuar con mi solicitud
    Reanudacion --> Default: borrador recuperado (precargado)
    Reanudacion --> Caducada: solicitud caducada
    Reanudacion --> Reanudacion: identificador inexistente
    Default --> BorradorGuardado: Guardar borrador (datos parciales)
    BorradorGuardado --> Default: seguir editando
    BorradorGuardado --> [*]: Continuar más tarde
    Default --> Error: acción con datos inválidos
    Error --> Error: acción con datos inválidos
    Default --> Loading: Solicitar alta con datos válidos
    Error --> Loading: acción con datos válidos
    Duplicado --> Loading: acción con datos corregidos
    Loading --> Enviada: submit OK (200)
    Loading --> Error: 400 / error de red
    Loading --> Duplicado: 409 documento activo
    Enviada --> Verificada: verificación superada
    Enviada --> Rechazada: verificación rechazada
    Verificada --> Completada: Completar alta
    Completada --> Default: Volver al inicio
    Rechazada --> Default: Volver al inicio
    Caducada --> Default: nueva solicitud
```
