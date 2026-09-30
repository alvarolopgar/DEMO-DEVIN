# Clarificaciones – 001 Crear siniestro auto (KAN-5)

Registro de ambigüedades detectadas en la fase **Clarify**. Ninguna ha sido confirmada todavía por negocio:
todas las decisiones siguientes se aplicaron para no bloquear la entrega y están marcadas como
**"Decisión provisional – pendiente de confirmación"**. Para confirmar o cambiar una decisión, siga el
playbook [SDD – Change Request](../../docs/devin/playbook-sdd-change-request.md).

| ID | Pregunta | Estado |
|---|---|---|
| C-001-01 | Clave canónica de la historia (KAN-5 vs DDD-2) | Decisión provisional – pendiente de confirmación |
| C-001-02 | Zona horaria y granularidad de la regla "fecha no futura" | Decisión provisional – pendiente de confirmación |
| C-001-03 | "Guardar borrador" vs "Enviar siniestro" | Decisión provisional – pendiente de confirmación |
| C-001-04 | Validación de formato de matrícula, teléfono, nombre y dirección | Decisión provisional – pendiente de confirmación |
| C-001-05 | Doble clic e idempotencia | Decisión provisional – pendiente de confirmación |
| C-001-06 | US4–US7 (DDD-17, DDD-22, DDD-27, DDD-32) no son historias de usuario | Recomendación (sin impacto en código) |
| C-001-07 | Tipo de siniestro fuera de catálogo | Decisión provisional – pendiente de confirmación |
| C-001-08 | Fecha del siniestro no informada en el servicio | Decisión provisional – pendiente de confirmación |
| C-001-09 | Usuario creador y autenticación | Decisión provisional – pendiente de confirmación |
| C-001-10 | Validación de póliza e integración Mulesoft | Decisión provisional – pendiente de confirmación |
| C-001-11 | Longitud máxima de la descripción y demás textos | Decisión provisional – pendiente de confirmación |
| C-001-12 | Umbrales de los NFR | Decisión provisional – pendiente de confirmación |

---

## C-001-01 – Clave canónica de la historia

- **Contexto / evidencia**: el PR, las ramas, los commits y el CI usan `KAN-5`; en Jira la historia es `DDD-2` (proyecto DDD, épica DDD-1).
- **Opciones**: A) KAN-5 canónica con DDD-2 como alias. B) Renombrar todo a DDD-2. C) Crear KAN-5 en Jira.
- **Recomendación**: A (no rompe el histórico de git ni el de Jira).
- **Decisión**: **KAN-5** es la clave canónica. DDD-2 se mantiene como alias (etiqueta `KAN-5` + `SDD` en Jira y comentario con enlace a la spec). No se borra nada en Jira.
- **Estado**: Decisión provisional – pendiente de confirmación
- **Impacto en la spec**: cabecera de `spec.md`, commits, `traceability.md`.

## C-001-02 – Zona horaria y granularidad de la regla "fecha no futura"

- **Contexto / evidencia**: el backend comparaba con `DateTime.UtcNow.Date` (UTC) y el frontend con `new Date("YYYY-MM-DD")` (que JavaScript interpreta como medianoche UTC) frente a la hora local del navegador. Entre las 00:00 y las 01:00/02:00 de Madrid el backend rechazaba como "futura" la fecha de hoy (brecha G-04). El análisis original (EC-01) proponía normalizar a UTC.
- **Opciones**: A) Europe/Madrid, día natural. B) UTC, día natural. C) Zona horaria del navegador.
- **Recomendación**: A (negocio en España; es lo que ve el gestor en su calendario).
- **Decisión**: "Hoy" = fecha civil vigente en **Europe/Madrid** (con sus cambios CET/CEST); la fecha del siniestro es una fecha sin hora y se compara por **día natural**. Backend y frontend aplican exactamente esta regla, con independencia de la zona horaria del servidor o del navegador.
- **Estado**: Decisión provisional – pendiente de confirmación
- **Impacto en la spec**: REQ-001-04, AC-001-06a..e, EC-001-04, EC-001-05, NFR-001-06.

## C-001-03 – "Guardar borrador" vs "Enviar siniestro"

- **Contexto / evidencia**: Figma muestra ambos botones; en el código "Guardar borrador" estaba deshabilitado (G-05). El análisis original (BR-DRF-04) sugería guardar borradores incompletos, pero el servicio exige todos los campos.
- **Opciones**: A) Ambos registran en Draft con validación completa vía el mismo alta. B) "Guardar borrador" permite datos incompletos (requiere cambiar el contrato y la validación). C) Ocultar "Guardar borrador".
- **Recomendación**: A (conservadora: no cambia el contrato ni relaja reglas).
- **Decisión**: En KAN-5 **ambas acciones** validan todos los campos y registran el siniestro en **Draft** mediante la misma operación de alta. La transición Draft → Submitted queda **fuera de alcance** (US3 – DDD-12). BR-DRF-04 (borrador incompleto) no aplica en KAN-5.
- **Estado**: Decisión provisional – pendiente de confirmación
- **Impacto en la spec**: REQ-001-11, AC-001-12, UI-001-01.

## C-001-04 – Validación de formato de matrícula, teléfono, nombre y dirección

- **Contexto / evidencia**: el análisis original proponía formatos (VF-04..07: matrícula española, teléfono de 9 dígitos, longitudes mínimas). El requisito de negocio solo exige que sean obligatorios; la implementación actual solo valida obligatoriedad.
- **Opciones**: A) Solo obligatoriedad. B) Añadir formatos del análisis.
- **Recomendación**: A (no añadir reglas no pedidas por negocio; evitar rechazar matrículas extranjeras o teléfonos internacionales).
- **Decisión**: Solo se valida la obligatoriedad (REQ-001-01/02). Los formatos quedan para una futura spec si negocio los confirma.
- **Estado**: Decisión provisional – pendiente de confirmación
- **Impacto en la spec**: REQ-001-01, tabla de mapeo (VF-04..07).

## C-001-05 – Doble clic e idempotencia

- **Contexto / evidencia**: EC-07 / VB-14 del análisis original. El servicio no tiene clave de idempotencia.
- **Opciones**: A) Mitigar en pantalla (acciones no disponibles mientras se envía). B) Idempotency-Key en servidor.
- **Recomendación**: A en KAN-5; B cuando exista integración Mulesoft.
- **Decisión**: A. La idempotencia en servidor queda fuera de alcance.
- **Estado**: Decisión provisional – pendiente de confirmación
- **Impacto en la spec**: EC-001-03, AC-001-17.

## C-001-06 – US4–US7 no son historias de usuario

- **Contexto / evidencia**: DDD-17 (US4), DDD-22 (US5), DDD-27 (US6) y DDD-32 (US7) describen capacidades técnicas/transversales (brecha G-08).
- **Recomendación**: convertirlas en NFR/criterios transversales de spec y plan (p. ej. NFR-001-03, NFR-001-05) y en tareas de plataforma. No se cierran ni borran en Jira; se deja un comentario con la recomendación.
- **Estado**: Recomendación (sin impacto en código) – pendiente de decisión del PO.

## C-001-07 – Tipo de siniestro fuera de catálogo

- **Contexto / evidencia**: el servicio aceptaba en JSON un valor numérico no definido (p. ej. `"claimType": 99`) porque el conversor de enumerados admite enteros y no había validación explícita.
- **Opciones**: A) Rechazar cualquier valor fuera de catálogo con 400. B) Aceptar solo nombres (no enteros).
- **Recomendación**: A (cambio mínimo, mantiene compatibilidad con clientes que envían nombres).
- **Decisión**: A. Mensaje: "El tipo de siniestro no es válido." El contrato publicado solo documenta los nombres.
- **Estado**: Decisión provisional – pendiente de confirmación
- **Impacto en la spec**: REQ-001-06, AC-001-08b, EC-001-07.

## C-001-08 – Fecha del siniestro no informada en el servicio

- **Contexto / evidencia**: si la petición no incluye la fecha, el servicio recibía el valor por defecto (0001-01-01), que no es futuro, y se aceptaba. La pantalla sí exigía la fecha.
- **Decisión**: el servicio rechaza la fecha no informada con "La fecha del siniestro es obligatoria.", igual que la pantalla (validación dual, Art. 6).
- **Estado**: Decisión provisional – pendiente de confirmación
- **Impacto en la spec**: REQ-001-01, AC-001-04, EC-001-08.

## C-001-09 – Usuario creador y autenticación

- **Contexto / evidencia**: el AC5 de Jira DDD-2 menciona "usuario creador"; no existe autenticación en el sistema.
- **Decisión**: fuera de alcance en KAN-5; se registran solo la fecha de alta (UTC) y el estado. Se abordará con la spec de autenticación.
- **Estado**: Decisión provisional – pendiente de confirmación
- **Impacto en la spec**: §3 fuera de alcance, mapeo AC5.

## C-001-10 – Validación de póliza e integración Mulesoft

- **Decisión**: el número de póliza solo se valida como obligatorio; no se comprueba su existencia. La integración con Mulesoft es futura y consumirá `contracts/openapi.yaml`.
- **Estado**: Decisión provisional – pendiente de confirmación

## C-001-11 – Longitud máxima de la descripción y demás textos

- **Contexto / evidencia**: EC-14 del análisis original; no hay requisito de negocio.
- **Decisión**: no se impone límite en KAN-5 (comportamiento actual). Se recomienda definirlo antes de la persistencia real en base de datos.
- **Estado**: Decisión provisional – pendiente de confirmación

## C-001-12 – Umbrales de los NFR

- **Contexto / evidencia**: los NFR originales no eran medibles (G-09).
- **Decisión**: se proponen los umbrales de `spec.md` §7 (p95 < 300 ms a 20 rps, 0 High/Critical, 100 % AC con test, WCAG 2.1 AA). NFR-001-01 queda pendiente de un entorno de preproducción para medirse.
- **Estado**: Decisión provisional – pendiente de confirmación
- **Impacto en la spec**: NFR-001-01..07.
