# Clarificaciones – 002 Alta digital de cliente (SPEC-002)

Registro de ambigüedades detectadas en la fase **Clarify**. Ninguna ha sido confirmada todavía por negocio:
todas las decisiones siguientes se aplicaron para no bloquear la entrega y están marcadas como
**"Decisión provisional – pendiente de confirmación"**. Para confirmar o cambiar una decisión, siga el
playbook [SDD – Change Request](../../docs/devin/playbook-sdd-change-request.md).

| ID | Pregunta | Estado |
|---|---|---|
| C-002-01 | Clave canónica de la historia (sin historia Jira asignada) | Decisión provisional – pendiente de confirmación |
| C-002-02 | Verificación real de la identidad | Decisión provisional – pendiente de confirmación |
| C-002-03 | Formato del teléfono | Decisión provisional – pendiente de confirmación |
| C-002-04 | Formato del pasaporte | Decisión provisional – pendiente de confirmación |
| C-002-05 | Acciones de la pantalla | Decisión provisional – pendiente de confirmación |
| C-002-06 | Credenciales y autenticación | Decisión provisional – pendiente de confirmación |
| C-002-07 | Doble envío e idempotencia | Decisión provisional – pendiente de confirmación |
| C-002-08 | Duplicado de documento: código de respuesta | Decisión provisional – pendiente de confirmación |
| C-002-09 | Identidad gráfica corporativa | Decisión provisional – pendiente de confirmación |
| C-002-10 | Gate spec-conformance antes de implementar | Decisión provisional – pendiente de confirmación |

---

## C-002-01 – Clave canónica de la historia

- **Contexto / evidencia**: el encargo llega por prompt de sesión ("alta digital de un cliente en un
  banco") sin historia de Jira. A fecha de esta spec no se encontró una historia en Jira que la cubra
  (las credenciales de API disponibles en esta sesión no autentican: HTTP 401).
- **Opciones**: A) Clave canónica provisional `SPEC-002` hasta que negocio cree la historia. B) Crear la
  historia en Jira ahora. C) Reusar la épica DDD-1 sin historia propia.
- **Recomendación**: A (no se inventa una clave Jira inexistente; se crea la historia cuando el PO la
  registre y se añade como clave canónica con `SPEC-002` como alias, igual que KAN-5/DDD-2).
- **Decisión**: **SPEC-002** es la clave canónica provisional. Cuando exista la historia Jira se actualiza
  el front matter de `spec.md`, `trace-map.json` y se enlaza el ticket con la spec.
- **Estado**: Decisión provisional – pendiente de confirmación
- **Impacto en la spec**: cabecera de `spec.md`, `trace-map.json` (`jira.default` vacío), commits.

## C-002-02 – Verificación real de la identidad

- **Contexto / evidencia**: un alta bancaria real exige verificación de identidad (selfie/videollamada,
  lectura NFC del documento, consulta a organismos). No se ha pedido proveedor ni flujo concreto.
- **Opciones**: A) Solo validación de formato del documento; la verificación real queda para otra spec.
  B) Integrar un proveedor de KYC ahora.
- **Recomendación**: A (el encargo es "alta digital"; la verificación es una historia posterior y el
  proveedor aún no está decidido).
- **Decisión**: A. El alta se registra en **PendienteVerificacion**; la validación del documento es de
  formato y letra de control, sin comprobar veracidad ni vigencia. La máquina de estados completa queda
  documentada como referencia en `data-model.md`.
- **Estado**: Decisión provisional – pendiente de confirmación
- **Impacto en la spec**: §3 fuera de alcance, REQ-002-03, REQ-002-05..07, máquina de estados.

## C-002-03 – Formato del teléfono

- **Contexto / evidencia**: el requisito solo pide "teléfono" como dato de contacto; un banco necesita un
  móvil para OTP.
- **Opciones**: A) Solo obligatorio. B) Móvil español: 9 dígitos empezando por 6 o 7, sin prefijo ni
  espacios. C) E.164 internacional.
- **Recomendación**: B (ámbito España, como el resto del producto; coherente con futuras notificaciones
  por SMS).
- **Decisión**: B. No se normaliza: `+34612345678` o `61 234 56 78` son inválidos.
- **Estado**: Decisión provisional – pendiente de confirmación
- **Impacto en la spec**: REQ-002-10, AC-002-12a/b, EC-002-06.

## C-002-04 – Formato del pasaporte

- **Contexto / evidencia**: los formatos de pasaporte varían por país emisor; no hay requisito de negocio.
- **Opciones**: A) Solo obligatorio. B) Patrón genérico (p. ej. 3 letras + 6 dígitos).
- **Recomendación**: A (un patrón genérico rechazaría pasaportes válidos de otros países).
- **Decisión**: A. El pasaporte solo se valida como dato obligatorio no vacío (REQ-002-07).
- **Estado**: Decisión provisional – pendiente de confirmación
- **Impacto en la spec**: REQ-002-07, AC-002-09.

## C-002-05 – Acciones de la pantalla

- **Contexto / evidencia**: en spec 001 había dos acciones ("Guardar borrador"/"Enviar"). Aquí no se ha
  pedido guardar una solicitud a medias, y un borrador sin todos los datos no puede validarse.
- **Opciones**: A) Acción única "Solicitar alta" con validación completa. B) "Guardar borrador" con datos
  incompletos (requeriría relajar el contrato y la validación).
- **Recomendación**: A (más conservadora; no cambia el contrato ni debilita la validación).
- **Decisión**: A. El alta en dos pasos (borrador incompleto, reanudación) queda para una futura spec.
- **Estado**: Decisión provisional – pendiente de confirmación
- **Impacto en la spec**: §3, REQ-002-17, AC-002-19..22, UI-002-01.

## C-002-06 – Credenciales y autenticación

- **Contexto / evidencia**: el alta completa suele terminar creando credenciales de acceso a la banca
  digital; no se han pedido.
- **Decisión**: fuera de alcance. La spec no define creación de usuario, contraseña ni OTP. Se abordará
  con la spec de onboarding-credenciales o la spec de autenticación.
- **Estado**: Decisión provisional – pendiente de confirmación
- **Impacto en la spec**: §3 fuera de alcance.

## C-002-07 – Doble envío e idempotencia

- **Contexto / evidencia**: misma situación que en spec 001 (EC-001-03, C-001-05): sin clave de
  idempotencia en servidor.
- **Decisión**: se mitiga en pantalla (la acción no está disponible mientras se envía, AC-002-19). La
  unicidad por documento (REQ-002-16) evita además que un reintento cree una segunda solicitud: el
  segundo envío recibe 409. La idempotencia formal (Idempotency-Key) queda fuera de alcance.
- **Estado**: Decisión provisional – pendiente de confirmación
- **Impacto en la spec**: EC-002-08, EC-002-09, AC-002-17a, AC-002-19.

## C-002-08 – Duplicado de documento: código de respuesta

- **Contexto / evidencia**: REQ-002-16 rechaza el alta duplicada; hay que elegir el código HTTP.
- **Opciones**: A) 409 Conflict (conflicto de unicidad, semántica REST estándar). B) 400 (se agrupa con
  la validación). C) 422.
- **Recomendación**: A (el recurso ya existe; no es un dato mal formado; 422 es menos habitual fuera de
  WebDAV).
- **Decisión**: A. El cuerpo sigue siendo Problem Details (RFC 7807) con el mensaje
  "Ya existe una solicitud de alta con ese documento de identidad."
- **Estado**: Decisión provisional – pendiente de confirmación
- **Impacto en la spec**: REQ-002-16, AC-002-17a, AC-002-18, `contracts/openapi.yaml`.

## C-002-09 – Identidad gráfica corporativa

- **Contexto / evidencia**: el encargo pide usar la identidad gráfica de
  `bancsabadell.com/bsnacional/es/particulares/` si hace falta construirla en esta etapa.
- **Decisión**: se documentan los tokens observados en la web (paleta, tipografía, sistema de diseño
  Galatea) en [`ui/brand.md`](ui/brand.md), con procedencia y notas de contraste. Los tokens son la fuente
  para los estados UI de esta spec; la librería propietaria Galatea (`bs-*`) no está disponible
  públicamente, así que la implementación mapeará los tokens sobre Fluent UI v9 (ver `plan.md`).
- **Estado**: Decisión provisional – pendiente de confirmación
- **Impacto en la spec**: NFR-002-04, NFR-002-09, `ui/states.md`, `ui/brand.md`.

## C-002-10 – Gate spec-conformance antes de implementar

- **Contexto / evidencia**: esta spec se entrega antes de escribir tests (Art. 1: la spec se aprueba por
  PR antes de implementar). La comprobación (b) de `check_spec_conformance.py` exigía que todo AC tuviera
  test, lo que impediría mergear una spec aún sin implementación.
- **Opciones**: A) Eximir del requisito AC↔test a las specs sin implementación (sin `code` en
  `trace-map.json` y sin ningún test que cite sus AC). B) Crear tests vacíos. C) Mergear sin pasar el gate.
- **Recomendación**: A (respeta Art. 1 y Art. 2: cuando llegue el primer código/test, la cobertura
  completa vuelve a ser obligatoria).
- **Decisión**: A. Una spec está "en implementación" cuando su `trace-map.json` mapea rutas de código o
  ya existe algún test que referencia sus AC; en ese momento todo AC debe tener test. El resto de
  comprobaciones del gate (REQ↔AC, plan.md, lint del contrato, trazabilidad) aplican siempre.
- **Estado**: Decisión provisional – pendiente de confirmación
- **Impacto en la spec**: NFR-002-07, `scripts/sdd/check_spec_conformance.py`, README.
