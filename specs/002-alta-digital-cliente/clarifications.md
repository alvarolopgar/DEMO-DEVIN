# Clarificaciones – 002 Alta digital de cliente (SPEC-002)

Registro de ambigüedades detectadas en la fase **Clarify**. Ninguna ha sido confirmada todavía por
negocio: todas las decisiones siguientes se aplicaron para no bloquear la entrega y están marcadas
como **"Decisión provisional – pendiente de confirmación"**. Para confirmar o cambiar una decisión,
siga el playbook [SDD – Change Request](../../docs/devin/playbook-sdd-change-request.md).

| ID | Pregunta | Estado |
|---|---|---|
| C-002-01 | Verificación de la identidad del solicitante | Decisión provisional – pendiente de confirmación |
| C-002-02 | Formato del teléfono | Decisión provisional – pendiente de confirmación |
| C-002-03 | Formato del pasaporte | Decisión provisional – pendiente de confirmación |
| C-002-04 | Guardar borrador y reanudar | Decisión provisional – pendiente de confirmación |
| C-002-05 | Credenciales y autenticación | Decisión provisional – pendiente de confirmación |
| C-002-06 | Doble envío e idempotencia | Decisión provisional – pendiente de confirmación |
| C-002-07 | Duplicado de documento: código de respuesta y estados que bloquean | Decisión provisional – pendiente de confirmación |
| C-002-08 | Caducidad de las solicitudes | Decisión provisional – pendiente de confirmación |
| C-002-09 | Identidad gráfica corporativa | Decisión provisional – pendiente de confirmación |
| C-002-10 | Gate spec-conformance antes de implementar | Decisión provisional – pendiente de confirmación |

---

## C-002-01 – Verificación de la identidad del solicitante

- **Contexto / evidencia**: un alta bancaria exige verificación de identidad. El encargo pide incluirla
  en alcance (requisitos, criterios de aceptación y tests), pero no se ha elegido proveedor real
  (selfie, videollamada, NFC, consulta a organismos).
- **Opciones**: A) Integrar ya un proveedor KYC real. B) Definir la interfaz del proveedor
  (`IIdentityVerificationService`) como parte del dominio y entregar una implementación **dummy**
  determinista que responda a las llamadas de verificación; el proveedor real se conecta después sin
  cambiar el contrato ni la máquina de estados.
- **Recomendación**: B (la spec queda completa end-to-end —transiciones incluidas— sin depender de una
  decisión de proveedor que no se ha tomado; el dummy permite ejecutar y probar el flujo).
- **Decisión**: B. La verificación está dentro de alcance (REQ-002-21, REQ-002-22). El componente
  `DummyIdentityVerificationService` (Infrastructure) responde de forma determinista e inmediata:
  **rechaza** las solicitudes cuyo número de documento normalizado empieza por `99` (convención de
  documentos sintéticos de prueba) y **verifica** el resto, devolviendo un motivo en el rechazo. Un
  fallo del proveedor es un error técnico y deja la solicitud en PendienteVerificacion. El dummy es un
  componente de infraestructura sustituible (scaffolding), no la implementación de los AC: la spec entra
  "en implementación" cuando llegue el primer test de AC del flujo de onboarding (C-002-10).
- **Estado**: Decisión provisional – pendiente de confirmación
- **Impacto en la spec**: §2 actores, §3 alcance, REQ-002-21/-22, AC-002-27/-28, EC-002-21/-22,
  NFR-002-10, `data-model.md` (transiciones), `contracts/openapi.yaml` (`POST /{id}/verify`),
  `plan.md` (ADR-002-08), `backend/.../DummyIdentityVerificationService.cs`.

## C-002-02 – Formato del teléfono

- **Contexto / evidencia**: el requisito solo pide "teléfono" como dato de contacto; un banco necesita un
  móvil para OTP.
- **Opciones**: A) Solo obligatorio. B) Móvil español: 9 dígitos empezando por 6 o 7, sin prefijo ni
  espacios. C) E.164 internacional.
- **Recomendación**: B (ámbito España, como el resto del producto; coherente con futuras notificaciones
  por SMS).
- **Decisión**: B. No se normaliza: `+34612345678` o `61 234 56 78` son inválidos.
- **Estado**: Decisión provisional – pendiente de confirmación
- **Impacto en la spec**: REQ-002-10, AC-002-12a/b, EC-002-06.

## C-002-03 – Formato del pasaporte

- **Contexto / evidencia**: los formatos de pasaporte varían por país emisor; no hay requisito de negocio.
- **Opciones**: A) Solo obligatorio. B) Patrón genérico (p. ej. 3 letras + 6 dígitos).
- **Recomendación**: A (un patrón genérico rechazaría pasaportes válidos de otros países).
- **Decisión**: A. El pasaporte solo se valida como dato obligatorio no vacío (REQ-002-07).
- **Estado**: Decisión provisional – pendiente de confirmación
- **Impacto en la spec**: REQ-002-07, AC-002-09.

## C-002-04 – Guardar borrador y reanudar

- **Contexto / evidencia**: el encargo pide explícitamente guardar una solicitud **incompleta** para
  recuperarla después. Un borrador sin todos los datos no puede validarse como un envío.
- **Opciones**: A) Solo "Solicitar alta" con validación completa. B) Dos acciones: "Guardar borrador"
  (datos parciales permitidos, sin validación de negocio, estado Borrador) y "Solicitar alta" (validación
  completa, transición a PendienteVerificacion); el borrador se recupera por su identificador.
- **Recomendación**: B (es lo pedido; el estado Borrador ya existía en la máquina de estados documentada
  y la reanudación usa el mismo GET por identificador).
- **Decisión**: B. Crear una solicitud siempre produce un Borrador (`POST /api/onboarding-requests`,
  campos opcionales); el borrador se modifica con `PATCH /{id}`, se reanuda con `GET /{id}` y se envía
  con `POST /{id}/submit`. En pantalla conviven las acciones "Guardar borrador" y "Solicitar alta".
- **Estado**: Decisión provisional – pendiente de confirmación
- **Impacto en la spec**: §3, REQ-002-03/-18/-19/-20, AC-002-23..26, UI-002-06/-07, contrato OpenAPI.

## C-002-05 – Credenciales y autenticación

- **Contexto / evidencia**: el alta completa suele terminar creando credenciales de acceso a la banca
  digital; no se han pedido.
- **Decisión**: fuera de alcance. La spec no define creación de usuario, contraseña ni OTP. El estado
  **ClienteCreado** significa "expediente de cliente creado" (alta completada), no acceso a la banca
  digital. Se abordará con la spec de credenciales o la spec de autenticación.
- **Estado**: Decisión provisional – pendiente de confirmación
- **Impacto en la spec**: §3 fuera de alcance, REQ-002-23, AC-002-29.

## C-002-06 – Doble envío e idempotencia

- **Contexto / evidencia**: misma situación que en spec 001 (EC-001-03, C-001-05): sin clave de
  idempotencia en servidor.
- **Decisión**: se mitiga en pantalla (las acciones no están disponibles mientras se envía, AC-002-19).
  La unicidad por documento (REQ-002-16) evita además que un reintento cree una segunda solicitud activa:
  el segundo envío recibe 409. Las actualizaciones de borrador (`PATCH`) son idempotentes por
  construcción. La idempotencia formal (Idempotency-Key) queda fuera de alcance.
- **Estado**: Decisión provisional – pendiente de confirmación
- **Impacto en la spec**: EC-002-08, EC-002-09, AC-002-17a, AC-002-19.

## C-002-07 – Duplicado de documento: código de respuesta y estados que bloquean

- **Contexto / evidencia**: REQ-002-16 limita la unicidad por documento; hay que elegir el código HTTP y
  decidir qué estados bloquean un nuevo alta.
- **Opciones**: A) 409 Conflict, bloquean solo las solicitudes activas (PendienteVerificacion,
  Verificada, ClienteCreado). B) 400 y bloquean todas las solicitudes existentes. C) 422.
- **Recomendación**: A (un Borrador puede abandonarse y una solicitud Rechazada o Caducada es un intento
  terminado que no debe impedir volver a empezar; el bloqueo real actúa al enviar, cuando la solicitud
  pasa a estar activa).
- **Decisión**: A. El chequeo de duplicado se aplica **en el envío** (`POST /{id}/submit`) contra
  solicitudes en PendienteVerificacion, Verificada o ClienteCreado. El cuerpo es Problem Details
  (RFC 7807) con el mensaje "Ya existe una solicitud de alta con ese documento de identidad."
- **Estado**: Decisión provisional – pendiente de confirmación
- **Impacto en la spec**: REQ-002-16, AC-002-17a, AC-002-33, AC-002-34, `contracts/openapi.yaml`.

## C-002-08 – Caducidad de las solicitudes

- **Contexto / evidencia**: con borradores y verificación pendiente hay solicitudes que pueden quedar
  abandonadas; hace falta una regla de caducidad. No hay plazo de negocio definido.
- **Opciones**: A) Sin caducidad. B) 30 días para Borrador (desde su creación) y 30 días para
  PendienteVerificacion (desde el envío). C) Plazos distintos por estado.
- **Recomendación**: B (plazo único y simple, suficiente para reanudar; fácil de ajustar cuando negocio
  confirme).
- **Decisión**: B. La transición a **Caducada** es **perezosa**: se aplica al acceder a la solicitud
  (lectura u operación) una vez superado el plazo, comprobado con el `TimeProvider`. Una solicitud
  Caducada no admite modificación, envío ni verificación; sigue siendo legible por su identificador para
  informar al solicitante.
- **Estado**: Decisión provisional – pendiente de confirmación
- **Impacto en la spec**: REQ-002-24, AC-002-30/-31, EC-002-20, `data-model.md`, UI-002-11.

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

- **Contexto / evidencia**: esta spec se entrega antes de escribir los tests del flujo (Art. 1: la spec
  se aprueba por PR antes de implementar). La comprobación (b) de `check_spec_conformance.py` exige que
  todo AC tenga test, lo que impediría mergear una spec aún sin implementación.
- **Opciones**: A) Eximir del requisito AC↔test a las specs sin implementación (sin `code` en
  `trace-map.json` y sin ningún test que cite sus AC). B) Crear tests vacíos. C) Mergear sin pasar el gate.
- **Recomendación**: A (respeta Art. 1 y Art. 2: cuando llegue el primer código/test, la cobertura
  completa vuelve a ser obligatoria). El servicio dummy de verificación (C-002-01) es scaffolding de
  infraestructura con tests propios no etiquetados con AC: no activa la regla por sí solo.
- **Decisión**: A. Una spec está "en implementación" cuando su `trace-map.json` mapea rutas de código o
  ya existe algún test que referencia sus AC; en ese momento todo AC debe tener test. El resto de
  comprobaciones del gate (REQ↔AC, plan.md, lint del contrato, trazabilidad) aplican siempre.
- **Estado**: Decisión provisional – pendiente de confirmación
- **Impacto en la spec**: NFR-002-07, `scripts/sdd/check_spec_conformance.py`, README.
