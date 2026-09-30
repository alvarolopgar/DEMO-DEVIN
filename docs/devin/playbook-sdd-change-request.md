# Playbook: SDD – Change Request (DEMO-DEVIN)

Cambio de un requisito ya especificado (o confirmación/cambio de una decisión provisional) en `alvarolopgar/DEMO-DEVIN`.
Orden obligatorio: **spec → tests → código → trazabilidad**, todo en un PR contra la rama base.

## Entradas

- Spec afectada (p. ej. `specs/001-crear-siniestro`) y descripción del cambio o `C-NNN-xx` a confirmar.
- Clave Jira del cambio.

## Pasos

1. **Spec primero.** Edita `spec.md` y/o `clarifications.md`:
   - Requisito modificado: conserva el ID y actualiza el texto; requisito nuevo: siguiente ID libre; requisito eliminado:
     márcalo como *Retirado* (no reutilices el ID).
   - Actualiza los AC afectados (Gherkin) y, si cambia la API, `contracts/openapi.yaml` y `plan.md`.
   - Decisión confirmada: cambia el estado de `C-NNN-xx` a "Confirmada por <persona> (<fecha>)".
   - Commit: `spec(<JIRA>): …`.
2. **Tests.** Ajusta o añade tests etiquetados con los AC afectados; comprueba que fallan con el código actual. Commit `test(<JIRA>): …`.
3. **Código.** Cambio mínimo hasta verde (`dotnet test`, `npm test`, `npm run lint`, `npm run build`). Commit `fix|feat(<JIRA>): …`.
4. **Trazabilidad.** Actualiza `tasks.md` y `trace-map.json` si cambian ficheros; ejecuta
   `python3 scripts/sdd/generate_traceability.py` y `python3 scripts/sdd/check_spec_conformance.py --base origin/<rama-base>`.
5. **PR y Jira.** Abre el PR, vigila el job `spec-conformance` y comenta en Jira el enlace al PR y los IDs cambiados.

## Gate

El PR no se fusiona si el diff de `specs/` no explica el cambio de código, si algún AC queda sin test o si `traceability.md` no está regenerado.
