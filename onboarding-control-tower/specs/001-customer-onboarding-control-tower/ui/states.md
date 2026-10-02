# Estados de interfaz – SPEC-001

| ID     | Estado  | Disparador                                      | Render                                                                                                                                                                          | Componente / test                |
| ------ | ------- | ----------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------- |
| UI-001 | Loading | Cualquier query en vuelo sin datos previos      | Skeletons (`aria-busy="true"`) en KPIs, Health y gráficos                                                                                                                       | `Skeleton`, `Dashboard.test.tsx` |
| UI-002 | Ready   | Todas las queries resueltas y `isEmpty = false` | Dashboard completo, filtros habilitados                                                                                                                                         | `Dashboard`                      |
| UI-003 | Empty   | `summary.isEmpty = true`                        | Panel «No hay datos para este filtro» con sugerencia de cambiar periodo/segmento; KPIs muestran «—», nunca 0 % ni deltas                                                        | `EmptyState`                     |
| UI-004 | Error   | Cualquier query del dashboard en error          | Aviso `role="alert"` «No se han podido cargar los datos» + botón **Reintentar** (refetch)                                                                                       | `ErrorState`                     |
| UI-005 | Detail  | `?app=<id>` en la URL (clic en fila o Enter)    | Drawer lateral `role="dialog"` con cabecera (ID, segmento, estado, SLA, riesgo) y timeline vertical ordenado; cierre con ✕, Escape o clic en el fondo; los filtros se conservan | `ApplicationDrawer`              |
| UI-006 | Alert   | `health.alert ≠ null`                           | Banner rojo `role="alert"` bajo la cabecera con el mensaje del backend                                                                                                          | `ExecutiveAlert`                 |

## Semántica de color (REQ-001-13)

| Valor del backend                                                                                 | Token             | Etiqueta                                      |
| ------------------------------------------------------------------------------------------------- | ----------------- | --------------------------------------------- |
| `COMPLETED`, `Risk.LOW`, `SlaStatus.WITHIN`, `HealthLight.GREEN`                                  | `ok` (verde)      | Completada / Bajo / En SLA / Saludable        |
| `STARTED`, `DATA_COMPLETED`, `VERIFYING`, `Risk.MEDIUM`, `SlaStatus.WARNING`, `HealthLight.AMBER` | `warn` (amarillo) | En curso / Medio / Próxima a SLA / Vigilancia |
| `REJECTED`, `Risk.HIGH`, `SlaStatus.BREACHED`, `HealthLight.RED`                                  | `danger` (rojo)   | Rechazada / Alto / Fuera de SLA / Alerta      |
| `EXPIRED`, `SlaStatus.NOT_EVALUATED`, `HealthLight.NO_DATA`                                       | `neutral` (gris)  | Caducada / No evaluable / Sin datos           |

Cada chip lleva texto además del color (no depende solo del color) y `data-tone` para tests.

## Accesibilidad

- Gráficos con `role="img"` + `aria-label` y tabla/lista textual `sr-only` con los valores.
- Filtros como `radiogroup` navegables con teclado; estado seleccionado con `aria-checked`.
- Filas de la tabla activables con teclado (Enter/Espacio).
- Layout de 12 columnas, `min-width` 1280 px óptimo 1440 px, sin scroll horizontal.
