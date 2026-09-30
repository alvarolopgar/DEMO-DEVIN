# Playbook: SDD – Feature (DEMO-DEVIN)

Implementa una historia nueva en `alvarolopgar/DEMO-DEVIN` siguiendo Spec-Driven Development.
La spec en `specs/<NNN>-<slug>/` es la única fuente de verdad; la conversación, Jira y Figma se sincronizan con ella.

## Entradas del usuario

- Clave Jira de la historia (p. ej. `KAN-6`) y número/slug de spec (p. ej. `002-consultar-siniestro`).
- Rama base del PR (por defecto `main`).
- Material de negocio: descripción, criterios, enlace Figma (opcional).

## Reglas generales

- Lee `AGENTS.md` y `.specify/memory/constitution.md` antes de empezar.
- No implementes nada que no esté en `spec.md`, ni cambies código sin `spec.md` y `plan.md`.
- IDs estables `REQ-/AC-/UI-/NFR-/EC-/C-/T-NNN-xx`; nunca reutilices ni renumeres un ID.
- Ambigüedades → `clarifications.md`. Si el usuario no responde, aplica la opción más conservadora marcada como
  "Decisión provisional – pendiente de confirmación" y continúa.
- Un commit por fase, mensaje con la clave Jira. Rama `devin/<timestamp>-<slug>`; nunca push a `main`.

## Fases

### 1. Constitution / Specify
- **Entradas**: material de negocio, historia Jira, `.specify/templates/spec-template.md`.
- **Salidas**: `specs/<NNN>-<slug>/spec.md` con front matter, alcance y fuera de alcance, `REQ-NNN-xx`,
  `AC-NNN-xx` en Gherkin (`### AC-NNN-xx – Título` + línea `REQ:`), `UI-NNN-xx`, `NFR-NNN-xx` medibles, `EC-NNN-xx`.
- **Gate**: solo QUÉ/POR QUÉ (sin clases, endpoints ni librerías); todo REQ con ≥ 1 AC; NFR con umbral y método de medida.
- **Prompt ejemplo**: "Crea `specs/002-consultar-siniestro/spec.md` para KAN-6 a partir de la descripción de Jira, usando la plantilla. Solo requisitos de negocio."

### 2. Clarify
- **Entradas**: `spec.md`.
- **Salidas**: `clarifications.md` con `C-NNN-xx` (pregunta, opciones, decisión, impacto en REQ/AC).
- **Gate**: ninguna ambigüedad sin decisión; decisiones no confirmadas marcadas como provisionales.
- **Prompt ejemplo**: "Revisa la spec 002 y lista las ambigüedades. Propón opciones y aplica la más conservadora como decisión provisional."

### 3. Plan
- **Entradas**: `spec.md`, `clarifications.md`, código existente.
- **Salidas**: `plan.md` (arquitectura, comprobación de la constitución, ADR, estrategia de pruebas),
  `data-model.md`, `contracts/openapi.yaml`.
- **Gate**: `npm run lint:openapi` sin errores ni warnings; plan coherente con .NET 8 / Next.js / Fluent UI / AKS.
- **Prompt ejemplo**: "Genera plan.md y el contrato OpenAPI de la spec 002 con cambios mínimos sobre el código actual."

### 4. Design (Figma)
- **Entradas**: `UI-NNN-xx` de la spec, archivo Figma.
- **Salidas**: `ui/states.md` con cada estado ↔ frame Figma (`node-id`); frames renombrados `UI-NNN-xx <Estado>`.
- **Gate**: cada UI enlazado a AC; si Figma no es accesible, se documenta el mapeo y se continúa.
- **Prompt ejemplo**: "Mapea los estados UI de la spec 002 a los frames de la página Figma 'KAN-6' y renómbralos con su UI-ID."

### 5. Tasks + Jira
- **Entradas**: `plan.md`.
- **Salidas**: `tasks.md` (`T-NNN-xx`, tipo, AC/REQ, código, Jira), `trace-map.json`; historia Jira con etiqueta `SDD`,
  AC con sus IDs y enlace a `spec.md`.
- **Gate**: toda tarea referencia AC/REQ; tareas de test antes que las de implementación del mismo AC.
- **Prompt ejemplo**: "Descompón el plan de la spec 002 en tareas atómicas y actualiza KAN-6 con los AC-002-xx y el enlace a la spec."

### 6. Tests-first
- **Entradas**: AC de la spec, contrato.
- **Salidas**: tests xUnit con `[Trait("AC", "AC-NNN-xx")]` + `[Trait("REQ", ...)]`, tests Vitest con título
  `"AC-NNN-xx: …"`, tests de contrato frente a `openapi.yaml`.
- **Gate**: los tests nuevos fallan por el motivo esperado (guardar la salida roja en el PR).
- **Prompt ejemplo**: "Escribe los tests de los AC-002-xx, ejecútalos y muéstrame que fallan antes de implementar."

### 7. Implement
- **Entradas**: tests en rojo, `plan.md`.
- **Salidas**: código mínimo para poner los tests en verde.
- **Gate**: `cd backend && dotnet build && dotnet test`; `npm ci && npm run lint && npm test && npm run build`.
- **Prompt ejemplo**: "Implementa lo mínimo para que pasen los tests de la spec 002, sin refactors ajenos."

### 8. Analyze / Verify
- **Entradas**: todo lo anterior.
- **Salidas**: `traceability.md` regenerado, PR contra la rama base, CI verde, comentario en Jira con el PR.
- **Gate**: `python3 scripts/sdd/check_spec_conformance.py --base origin/<rama-base>` y job CI `spec-conformance` en verde
  (100 % AC con test, 0 tests con AC inexistente, contrato válido, trazabilidad al día).
- **Prompt ejemplo**: "Regenera la trazabilidad, ejecuta el gate SDD, abre el PR y vigila el CI hasta que esté verde."

## Entrega final

Enlace al PR, decisiones provisionales pendientes de confirmar (de `clarifications.md`) y lo que no se haya podido hacer con su motivo.
