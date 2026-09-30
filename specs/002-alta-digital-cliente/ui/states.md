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
| UI-002-04 | Success | _pendiente de crear (T-002-16)_ | AC-002-22 |
| UI-002-05 | Duplicado | _pendiente de crear (T-002-16)_ | AC-002-17a, AC-002-21 |

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
- Acción única **"Solicitar alta"** (primaria, azul de marca). Leyenda bajo el botón:
  "Tu solicitud quedará pendiente de verificación de identidad."

## UI-002-02 – Error

- Validación en pantalla (AC-002-20): mensaje bajo cada campo inválido; no se llama al servicio.
- Errores del servicio (AC-002-21): un aviso de error por cada mensaje devuelto; si no hay conexión,
  "Error de conexión. Inténtelo de nuevo.".
- El formulario conserva los valores introducidos.

## UI-002-03 – Loading

- Spinner con el texto "Enviando solicitud..." (AC-002-19).
- El formulario y la acción no se muestran, lo que evita envíos duplicados (EC-002-08).

## UI-002-04 – Success

- Icono de confirmación, "Solicitud de alta registrada", "ID: <uuid>" y
  "Estado: PendienteVerificacion" (AC-002-22).
- Texto informativo del siguiente paso: "Te contactaremos para verificar tu identidad."
- Acción "Volver al inicio", que vuelve a UI-002-01 con el formulario vacío.

## UI-002-05 – Duplicado

- Aviso de error persistente "Ya existe una solicitud de alta con ese documento de identidad."
  (AC-002-17a) sobre el formulario, con el foco en el campo Número de documento.
- El formulario conserva los valores introducidos y la acción "Solicitar alta" vuelve a estar
  disponible para corregir el dato.

## Transiciones

```mermaid
stateDiagram-v2
    [*] --> Default
    Default --> Error: acción con datos inválidos
    Error --> Error: acción con datos inválidos
    Default --> Loading: acción con datos válidos
    Error --> Loading: acción con datos válidos
    Duplicado --> Loading: acción con datos corregidos
    Loading --> Success: 201
    Loading --> Error: 400 / error de red
    Loading --> Duplicado: 409
    Success --> Default: Volver al inicio
```
