# Constitución del proyecto – Gestión de Siniestros Auto (DEMO-DEVIN)

Versión: 1.0.0 · Ratificada: 2026-09-30 · Ámbito: todo el repositorio `alvarolopgar/DEMO-DEVIN`

Esta constitución recoge los principios **no negociables** del SDLC Spec-Driven Development (SDD) del proyecto.
Cualquier excepción requiere una **enmienda** aprobada por PR (ver "Gobierno" al final).
Las personas y los agentes (Devin) la aplican por igual; `AGENTS.md` la operacionaliza.

---

## Art. 1 – Spec primero

1. Ningún cambio de comportamiento en `backend/**` o `src/**` se implementa sin una carpeta `specs/<NNN>-<slug>/`
   que contenga al menos `spec.md` y `plan.md` aprobados por PR.
2. `spec.md` describe **QUÉ** y **POR QUÉ** (requisitos, criterios de aceptación, estados de UI, NFR, casos límite).
   No contiene decisiones tecnológicas; estas viven en `plan.md`, `data-model.md` y `contracts/`.
3. La spec es la **fuente de verdad**. Jira, Figma, tests y código son derivados y se enlazan a ella.
   Una conversación (chat, prompt, reunión) nunca es fuente de verdad: lo acordado se escribe en `specs/`.
4. Un cambio de requisito se hace **primero en la spec** (PR de spec), después en tests y por último en código.

## Art. 2 – Test-first

1. Los tests de aceptación se derivan de los `AC-NNN-xx` de la spec **antes** de implementar y deben fallar primero (rojo → verde).
2. Cada `AC` de `spec.md` tiene al menos un test automatizado; ningún test referencia un `AC` inexistente.
3. Backend: xUnit con `[Trait("AC", "AC-NNN-xx")]` y `[Trait("REQ", "REQ-NNN-xx")]`.
   Frontend: Vitest, con el ID del AC al inicio del título del test (`it("AC-NNN-xx …")`).

## Art. 3 – Contract-first

1. Toda API HTTP se define en `specs/<NNN>-<slug>/contracts/openapi.yaml` antes de implementarla.
2. El código se valida contra el contrato con tests de contrato automatizados; el Swagger generado por el código
   no sustituye al contrato.
3. El contrato pasa un linter OpenAPI en CI sin errores.

## Art. 4 – Trazabilidad

1. Los IDs son **estables** y nunca se reutilizan: `REQ-NNN-xx`, `AC-NNN-xx[a-z]`, `UI-NNN-xx`, `NFR-NNN-xx`, `EC-NNN-xx`,
   `C-NNN-xx` (clarificaciones) y `T-NNN-xx` (tareas). `NNN` es el número de la spec.
2. Los mismos IDs se usan sin cambios en Jira, Figma (nombre de frame), tests, commits y CI.
3. Cada commit referencia la clave de la historia (p. ej. `KAN-5`) y, cuando aplique, los `AC`/`REQ` afectados.
4. `traceability.md` se **genera** (`scripts/sdd/generate_traceability.py`), nunca se edita a mano, y CI falla si está desactualizada.

## Art. 5 – Seguridad

1. Para mergear a `main` no puede haber vulnerabilidades **High** o **Critical** abiertas (Snyk SCA + SAST) en código de producción.
2. Nunca se commitean secretos. Las credenciales se inyectan por variables de entorno / secretos de CI.

## Art. 6 – Validación dual

1. Toda regla de negocio se implementa en el backend (autoritativo) y, cuando aporte UX, en el frontend,
   **con la misma semántica**, documentada una única vez en la spec.
2. Cada regla dual tiene tests en ambos lados enlazados al mismo `AC`.

## Art. 7 – Fechas y zona horaria

1. La zona horaria de negocio es **`Europe/Madrid`** y la granularidad de las fechas de negocio es el **día natural**
   (decisión provisional, ver `specs/001-crear-siniestro/clarifications.md` C-001-02).
2. "Hoy" se calcula siempre como la fecha civil actual en `Europe/Madrid`, tanto en backend como en frontend.
3. Las marcas de tiempo técnicas (`createdAt`, auditoría) se almacenan en UTC.

## Art. 8 – Stack tecnológico

1. Backend: .NET 8 LTS (Web API, Clean Architecture). Frontend: React con Next.js y Fluent UI v9.
   Despliegue objetivo: AKS. Integración futura: Mulesoft vía contrato OpenAPI.
2. Cambiar el stack requiere enmienda de este artículo.

## Art. 9 – Ambigüedades

1. Ante una ambigüedad se registra una entrada en `clarifications.md` con opciones, recomendación y estado.
2. Si no hay respuesta y el trabajo no puede esperar, se aplica la opción **más conservadora**, marcada como
   "Decisión provisional – pendiente de confirmación", y se continúa.

## Art. 10 – Simplicidad

1. Cambios mínimos y enfocados: no se añade comportamiento no especificado en la spec.
2. Todo comportamiento observable no especificado se considera un defecto (de la spec o del código).

---

## Gobierno

- **Enmiendas**: PR que modifica este fichero con justificación, incremento de versión (SemVer) y aprobación de arquitectura.
- **Cumplimiento**: el job de CI `spec-conformance` y la revisión de PR verifican los artículos 1–4 y 6.
- **Prevalencia**: esta constitución prevalece sobre `AGENTS.md`, plantillas y specs en caso de conflicto.
