---
spec: "NNN-slug"
title: "<Título de la historia>"
jira: "<CLAVE-JIRA canónica>"
jira_aliases: []
status: "Borrador | En revisión | Aprobada"
version: "0.1.0"
---

# NNN – <Título> (<CLAVE-JIRA>)

> Solo **QUÉ** y **POR QUÉ**. Nada de tecnología (va en `plan.md`).
> IDs estables: nunca renumerar ni reutilizar. Un requisito eliminado se marca `(retirado)`.

## 1. Contexto y objetivo

<Quién necesita qué y para qué.>

## 2. Actores

- <Actor>: <rol>

## 3. Alcance

### Dentro de alcance
- ...

### Fuera de alcance
- ... (referencia a la historia/spec que lo cubre)

## 4. Requisitos funcionales

| ID | Requisito |
|---|---|
| REQ-NNN-01 | El sistema ... |

## 5. Criterios de aceptación

Formato: un encabezado `### AC-NNN-xx – <título>` por criterio, línea `REQ:` con los requisitos que verifica
y bloque Gherkin. Sufijo de letra (`AC-NNN-06a`, `-06b`) para variantes del mismo criterio.

### AC-NNN-01 – <título>
REQ: REQ-NNN-01

```gherkin
Scenario: ...
  Given ...
  When ...
  Then ...
```

## 6. Estados de interfaz

| ID | Estado | Descripción | Diseño |
|---|---|---|---|
| UI-NNN-01 | Default | ... | ver `ui/states.md` |

## 7. Requisitos no funcionales (medibles)

| ID | Requisito | Métrica / umbral | Verificación |
|---|---|---|---|
| NFR-NNN-01 | ... | ... | test / CI job / medición |

## 8. Casos límite

| ID | Caso | Comportamiento esperado | AC |
|---|---|---|---|
| EC-NNN-01 | ... | ... | AC-NNN-xx |

## 9. Preguntas abiertas y decisiones

Ver [`clarifications.md`](clarifications.md). Ninguna ambigüedad se resuelve fuera de ese fichero.
