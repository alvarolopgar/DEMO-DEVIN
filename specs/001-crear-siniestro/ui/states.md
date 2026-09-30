# Estados de interfaz – 001 Crear siniestro auto (KAN-5)

Archivo Figma: [Devin-demo-Figma](https://www.figma.com/design/EDlAb7RBmlokWehf8kUdmB/Devin-demo-Figma) · página **"KAN-5 – Crear Siniestro"**.
Implementación: `src/components/ClaimForm.tsx` (ruta `/claims/new`).

## Mapeo UI-ID → frame Figma

| UI | Estado | Frame Figma | AC |
|---|---|---|---|
| UI-001-01 | Default | [Default](https://www.figma.com/design/EDlAb7RBmlokWehf8kUdmB/Devin-demo-Figma?node-id=28-2) | AC-001-12 |
| UI-001-02 | Error | [Error](https://www.figma.com/design/EDlAb7RBmlokWehf8kUdmB/Devin-demo-Figma?node-id=28-63) | AC-001-13, AC-001-15 |
| UI-001-03 | Loading | [Loading](https://www.figma.com/design/EDlAb7RBmlokWehf8kUdmB/Devin-demo-Figma?node-id=28-127) | AC-001-17 |
| UI-001-04 | Success | [Success](https://www.figma.com/design/EDlAb7RBmlokWehf8kUdmB/Devin-demo-Figma?node-id=28-192) | AC-001-14 |

**Renombrado de frames pendiente.** El nombre objetivo de cada frame es `<UI-ID> <Estado>` (p. ej. `UI-001-01 Default`).
No se pudo renombrar automáticamente: la API de Figma respondió HTTP 401/403 con los tokens disponibles, el servidor MCP de Figma
no arrancó y, además, la API REST de Figma es de solo lectura para nodos (renombrar exige un plugin de Figma o edición manual). Los `node-id` proceden del historial de la sesión que creó los frames (orden Default, Error, Loading, Success);
verifíquelos al renombrar. Hasta entonces, esta tabla es el mapeo oficial.

## UI-001-01 – Default

- Cabecera "Gestión de Siniestros", título "Nuevo Siniestro Auto" e indicador "Estado: Draft".
- 9 campos obligatorios (marcados con asterisco): Número de póliza, Fecha del siniestro, Tipo de siniestro
  (Colisión, Robo, Incendio, Cristales; por defecto Colisión), Matrícula del vehículo, Nombre del asegurado, Teléfono,
  Dirección, Código postal (máx. 5 caracteres) y Descripción.
- Acciones: **"Guardar borrador"** (secundaria) y **"Enviar siniestro"** (primaria). Ambas están habilitadas,
  validan el formulario y registran el siniestro en Draft (C-001-03). Leyenda bajo los botones:
  "Ambas acciones guardan el siniestro en estado Draft."

## UI-001-02 – Error

- Validación en pantalla (AC-001-13): mensaje bajo cada campo inválido; no se llama al servicio.
- Errores del servicio (AC-001-15): un aviso de error por cada mensaje devuelto; si no hay conexión,
  "Error de conexión. Inténtelo de nuevo.".
- El formulario conserva los valores introducidos.

## UI-001-03 – Loading

- Spinner con el texto "Enviando siniestro..." (AC-001-17).
- El formulario y las acciones no se muestran, lo que evita envíos duplicados (EC-001-03).

## UI-001-04 – Success

- Icono de confirmación, "Siniestro creado correctamente", "ID: <uuid>" y "Estado: Draft" (AC-001-14).
- Acción "Crear nuevo siniestro", que vuelve a UI-001-01 con el formulario vacío.

## Transiciones

```mermaid
stateDiagram-v2
    [*] --> Default
    Default --> Error: acción con datos inválidos
    Error --> Error: acción con datos inválidos
    Default --> Loading: acción con datos válidos
    Error --> Loading: acción con datos válidos
    Loading --> Success: 201
    Loading --> Error: 400 / error de red
    Success --> Default: Crear nuevo siniestro
```
