---
spec: '001'
title: 'Customer Onboarding Control Tower'
version: '1.0'
status: 'implementado'
source: 'SPEC-001_Customer_Onboarding_Control_Tower_Requisitos.docx (v1.0)'
plan: 'plan.md (PLAN-001 v1.0)'
---

# SPEC-001 — Customer Onboarding Control Tower

> Solo QUÉ y POR QUÉ. Las decisiones técnicas están en [`plan.md`](plan.md). Las ambigüedades y decisiones
> provisionales están en [`clarifications.md`](clarifications.md).

## 1. Propósito y narrativa de negocio

La solución mostrará, en una única pantalla ejecutiva, el rendimiento del proceso de onboarding digital de clientes.
Debe permitir entender en pocos segundos cuántas solicitudes entran, dónde se pierden, cuánto tardan, qué porcentaje
cumple el SLA y cuáles son las causas principales de abandono o rechazo.

## 2. Actores

| Actor                          | Necesidad                                                                                |
| ------------------------------ | ---------------------------------------------------------------------------------------- |
| CxO / Dirección                | Comprender de un vistazo salud, conversión, SLA y principales fricciones del onboarding. |
| Responsable de Operaciones     | Identificar solicitudes atascadas, tendencias y causas de abandono.                      |
| Responsable Digital / Producto | Comparar segmentos y periodos para priorizar mejoras del journey.                        |

## 3. Alcance

### Dentro de alcance

- Dashboard ejecutivo de onboarding con KPIs, funnel, evolución temporal, distribución por estado, causas de abandono y tabla de últimas solicitudes.
- Selector de periodo: Hoy, 7 días y 30 días.
- Selector de segmento: Todos, Digital, Oficina y Partner.
- Cálculo y visualización de SLA.
- Detalle lateral de una solicitud con timeline de eventos.
- Datos sintéticos deterministas suficientes para provocar estados verdes, amarillos y rojos.
- Comparación de KPIs con el periodo anterior.

### Fuera de alcance

- Edición manual de las solicitudes desde el dashboard.

## 4. Modelo conceptual

| Concepto        | Definición                                                                                         |
| --------------- | -------------------------------------------------------------------------------------------------- |
| Solicitud       | Instancia de onboarding sintética identificada por un ID anónimo.                                  |
| Estado          | Iniciada, DatosCompletados, Verificando, Completada, Rechazada o Caducada.                         |
| Etapa de funnel | Inicio, Datos, Verificación y Cliente creado.                                                      |
| SLA             | Una solicitud activa está en SLA si su tiempo transcurrido es menor o igual al umbral configurado. |
| Riesgo          | Clasificación visual Bajo, Medio o Alto usada en la tabla de solicitudes.                          |
| Segmento        | Canal de entrada: Digital, Oficina o Partner.                                                      |

Solicitud **activa** = estado Iniciada, DatosCompletados o Verificando (ver C-001-03).

## 5. Requisitos funcionales

| ID         | Requisito                                                                                                                                             |
| ---------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| REQ-001-01 | El dashboard muestra cuatro KPIs principales: solicitudes, conversión, tiempo medio de onboarding y cumplimiento de SLA.                              |
| REQ-001-02 | Cada KPI muestra el valor del periodo seleccionado y su variación frente al periodo inmediatamente anterior equivalente.                              |
| REQ-001-03 | El usuario puede seleccionar el periodo Hoy, 7 días o 30 días; todas las visualizaciones se actualizan de forma coherente.                            |
| REQ-001-04 | El usuario puede seleccionar el segmento Todos, Digital, Oficina o Partner; todas las visualizaciones se filtran por el segmento seleccionado.        |
| REQ-001-05 | Se muestra un funnel con las etapas Inicio, Datos, Verificación y Cliente creado, indicando volumen y conversión entre etapas.                        |
| REQ-001-06 | Se muestra una gráfica temporal con el número de solicitudes completadas, en curso y rechazadas a lo largo del periodo.                               |
| REQ-001-07 | Se muestra una distribución de solicitudes por estado mediante una visualización circular o equivalente.                                              |
| REQ-001-08 | Se muestran las principales causas de abandono o rechazo ordenadas por volumen, con porcentaje sobre el total de incidencias del periodo.             |
| REQ-001-09 | Se muestra el porcentaje de solicitudes activas dentro de SLA y el número de solicitudes próximas o fuera de SLA.                                     |
| REQ-001-10 | El umbral inicial de SLA de la demo es de 5 minutos desde el inicio hasta la finalización del onboarding.                                             |
| REQ-001-11 | Una solicitud activa con más de 5 minutos se considera fuera de SLA; una solicitud activa entre 4 y 5 minutos se considera próxima al incumplimiento. |
| REQ-001-12 | La pantalla muestra las últimas 20 solicitudes del filtro actual con ID, segmento, estado, tiempo transcurrido y riesgo.                              |
| REQ-001-13 | La tabla usa codificación visual: verde para completada/bajo, amarillo para en curso/medio y rojo para rechazada, fuera de SLA o riesgo alto.         |
| REQ-001-14 | Al seleccionar una solicitud se abre un panel lateral con su timeline de eventos y marcas temporales.                                                 |
| REQ-001-15 | El timeline muestra, cuando existen, los eventos Solicitud iniciada, Datos completados, Documento validado, Identidad verificada y Cliente creado.    |
| REQ-001-16 | La pantalla muestra un bloque Health del proceso con Conversión, SLA y Error de verificación, cada uno con semáforo visual.                           |
| REQ-001-17 | Cuando el error de verificación del periodo aumenta más de un 20 % frente al periodo anterior, se muestra una alerta ejecutiva.                       |
| REQ-001-18 | El dashboard conserva el filtro de periodo y segmento mientras el usuario navega entre la vista principal y el detalle de una solicitud.              |
| REQ-001-19 | Si un filtro no devuelve datos, la pantalla muestra un estado vacío explícito sin errores de ejecución.                                               |
| REQ-001-20 | Todos los datos mostrados son sintéticos y anonimizados; ningún campo contiene nombre, documento, teléfono o correo reales.                           |

## 6. Reglas de cálculo

| ID     | Regla                                                                                                            |
| ------ | ---------------------------------------------------------------------------------------------------------------- |
| BR-001 | Conversión = solicitudes Completadas / solicitudes Iniciadas × 100.                                              |
| BR-002 | Tiempo medio = media del tiempo entre Inicio y Cliente creado para solicitudes Completadas.                      |
| BR-003 | SLA cumplido = solicitudes activas o completadas dentro del umbral / solicitudes evaluables × 100.               |
| BR-004 | Próxima a SLA = solicitud activa con tiempo > 4 min y ≤ 5 min.                                                   |
| BR-005 | Fuera de SLA = solicitud activa con tiempo > 5 min.                                                              |
| BR-006 | Error de verificación = solicitudes Rechazadas por verificación / solicitudes que alcanzaron Verificación × 100. |
| BR-007 | La variación de KPI se compara con un periodo anterior de idéntica duración y mismo segmento.                    |

## 7. Criterios de aceptación

### AC-001-01 – Dashboard inicial

REQ: REQ-001-01, REQ-001-05, REQ-001-06, REQ-001-07, REQ-001-08, REQ-001-09, REQ-001-12, REQ-001-16

```gherkin
Given existen datos sintéticos para los últimos 30 días
When el usuario abre el dashboard
Then ve los 4 KPIs, funnel, evolución, distribución, causas, SLA y últimas solicitudes
```

### AC-001-02 – Cambio de periodo

REQ: REQ-001-02, REQ-001-03

```gherkin
Given el dashboard está mostrando Hoy
When el usuario selecciona 7 días
Then todos los KPIs y gráficos se recalculan para 7 días
```

### AC-001-03 – Cambio de segmento

REQ: REQ-001-04

```gherkin
Given el segmento es Todos
When el usuario selecciona Partner
Then todos los componentes muestran únicamente datos de Partner
```

### AC-001-04 – Funnel consistente

REQ: REQ-001-05

```gherkin
Given 1.000 solicitudes iniciadas y 780 completadas
When se muestra el funnel
Then Inicio muestra 1.000 y Cliente creado 780 y la conversión final es 78 %
```

### AC-001-05 – Solicitud próxima a SLA

REQ: REQ-001-09, REQ-001-11, REQ-001-13

```gherkin
Given una solicitud activa lleva 4 min 30 s
When se muestra el dashboard
Then se marca como próxima a SLA con tratamiento amarillo
```

### AC-001-06 – Solicitud fuera de SLA

REQ: REQ-001-09, REQ-001-10, REQ-001-11, REQ-001-13

```gherkin
Given una solicitud activa lleva 5 min 01 s
When se muestra el dashboard
Then se marca fuera de SLA con tratamiento rojo
```

### AC-001-07 – Detalle de solicitud

REQ: REQ-001-14, REQ-001-15, REQ-001-18

```gherkin
Given existe la solicitud CL-10481
When el usuario selecciona su fila
Then se abre un panel con su timeline ordenado cronológicamente
```

### AC-001-08 – Alerta ejecutiva

REQ: REQ-001-16, REQ-001-17

```gherkin
Given el error de verificación creció más de 20 % frente al periodo anterior
When se muestra Health del proceso
Then aparece una alerta indicando el incremento
```

### AC-001-09 – Estado vacío

REQ: REQ-001-19

```gherkin
Given el filtro seleccionado no tiene solicitudes
When se aplica el filtro
Then se muestra un estado vacío y no se muestran valores engañosos
```

### AC-001-10 – Datos sin PII

REQ: REQ-001-20

```gherkin
Given cualquier respuesta del servicio de demo
When se inspeccionan sus datos
Then no contiene nombre, DNI/NIE, teléfono ni correo real
```

## 8. Estados de interfaz

| ID     | Estado  | Comportamiento                                                               | AC                              |
| ------ | ------- | ---------------------------------------------------------------------------- | ------------------------------- |
| UI-001 | Loading | Skeleton o placeholders en KPIs y gráficos mientras se cargan datos.         | AC-001-01                       |
| UI-002 | Ready   | Dashboard completo con datos y controles habilitados.                        | AC-001-01, AC-001-02, AC-001-03 |
| UI-003 | Empty   | Mensaje “No hay datos para este filtro” y visualizaciones vacías coherentes. | AC-001-09                       |
| UI-004 | Error   | Aviso de error recuperable con acción Reintentar.                            | AC-001-01                       |
| UI-005 | Detail  | Drawer lateral con timeline de la solicitud seleccionada.                    | AC-001-07                       |
| UI-006 | Alert   | Banner ejecutivo visible cuando una métrica supera su condición de alerta.   | AC-001-08                       |

## 9. Requisitos no funcionales

| ID         | Requisito               | Métrica / verificación                                                                                               |
| ---------- | ----------------------- | -------------------------------------------------------------------------------------------------------------------- |
| NFR-001-01 | Cobertura de aceptación | 100 % de los AC con al menos un test automatizado (gate `spec-conformance`).                                         |
| NFR-001-02 | Pruebas de seguridad    | Incluir pruebas de seguridad del código: suite automatizada `apps/api/test/security` + `npm audit` en CI (C-001-14). |

## 10. Datos semilla esperados para la demo

La semilla debe provocar de forma intencionada una narrativa visual clara. Los valores exactos pueden variar mientras
conserven las proporciones y comportamientos siguientes:

| Indicador                      | Objetivo visual                                                                        |
| ------------------------------ | -------------------------------------------------------------------------------------- |
| Solicitudes 30 días            | ≈ 12.000–13.000                                                                        |
| Conversión                     | ≈ 77–80 %                                                                              |
| Tiempo medio                   | ≈ 4 min                                                                                |
| SLA                            | ≈ 91–93 %, ligeramente por debajo de objetivo 95 %                                     |
| Rechazadas                     | ≈ 8–10 %                                                                               |
| Causa principal                | Documento inválido ≈ 30–35 % de incidencias                                            |
| Solicitudes próximas/fuera SLA | Suficientes para mostrar amarillo y rojo simultáneamente                               |
| Segmentos                      | Digital mayoritario; Partner con peor conversión para que el filtro produzca contraste |
