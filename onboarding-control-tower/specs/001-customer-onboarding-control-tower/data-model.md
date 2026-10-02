# Modelo de datos – SPEC-001

Persistencia: SQLite vía Prisma (`apps/api/prisma/schema.prisma`).

## OnboardingApplication

| Campo           | Tipo               | Descripción                                                                                                                                    |
| --------------- | ------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| id              | string (PK)        | ID anónimo `CL-NNNNN` (p. ej. `CL-10481`).                                                                                                     |
| segment         | enum `Segment`     | `DIGITAL` · `OFFICE` · `PARTNER`.                                                                                                              |
| status          | enum `Status`      | `STARTED` · `DATA_COMPLETED` · `VERIFYING` · `COMPLETED` · `REJECTED` · `EXPIRED`.                                                             |
| risk            | enum `Risk`        | `LOW` · `MEDIUM` · `HIGH` (dato seed, PLAN §8).                                                                                                |
| stage           | enum `FunnelStage` | Etapa más avanzada alcanzada: `START` · `DATA` · `VERIFICATION` · `CUSTOMER_CREATED` (desnormalizado para agregar el funnel en SQL, C-001-09). |
| startedAt       | datetime           | Inicio del onboarding.                                                                                                                         |
| completedAt     | datetime?          | Fin cuando se completa.                                                                                                                        |
| closedAt        | datetime?          | Fin de cualquier estado terminal (completada, rechazada o caducada).                                                                           |
| durationSec     | int?               | `closedAt − startedAt` en segundos (desnormalizado para BR-002/BR-003).                                                                        |
| rejectionReason | enum `Reason`?     | `DOCUMENT_INVALID` · `IDENTITY_FAILED` · `INCOMPLETE` · `ABANDONED` · `OTHER`.                                                                 |
| events          | relación 1-N       | Timeline.                                                                                                                                      |

Índices: `startedAt`, `(segment, startedAt)`, `status`.

## OnboardingEvent

| Campo         | Tipo             | Descripción                                                                                     |
| ------------- | ---------------- | ----------------------------------------------------------------------------------------------- |
| id            | int (PK)         | Autoincremental.                                                                                |
| applicationId | string (FK)      | Solicitud.                                                                                      |
| type          | enum `EventType` | `STARTED` · `DATA_COMPLETED` · `DOCUMENT_VALIDATED` · `IDENTITY_VERIFIED` · `CUSTOMER_CREATED`. |
| occurredAt    | datetime         | Marca temporal.                                                                                 |

## DatasetMeta

| Campo  | Tipo         | Descripción                                            |
| ------ | ------------ | ------------------------------------------------------ |
| id     | int (PK = 1) | Fila única.                                            |
| anchor | datetime     | Instante de referencia («ahora» de la demo, C-001-02). |
| seed   | int          | Semilla del PRNG.                                      |

## Máquina de estados

```
STARTED ──► DATA_COMPLETED ──► VERIFYING ──► COMPLETED
   │              │                │
   └──────────────┴──► EXPIRED     └──► REJECTED (DOCUMENT_INVALID | IDENTITY_FAILED)
                  └──► REJECTED (OTHER)
```

| Estado                           | Etapa            | Eventos presentes                              |
| -------------------------------- | ---------------- | ---------------------------------------------- |
| STARTED                          | START            | STARTED                                        |
| DATA_COMPLETED                   | DATA             | STARTED, DATA_COMPLETED                        |
| VERIFYING                        | VERIFICATION     | STARTED, DATA_COMPLETED [, DOCUMENT_VALIDATED] |
| COMPLETED                        | CUSTOMER_CREATED | los 5 eventos                                  |
| REJECTED (DOCUMENT_INVALID)      | VERIFICATION     | STARTED, DATA_COMPLETED                        |
| REJECTED (IDENTITY_FAILED)       | VERIFICATION     | STARTED, DATA_COMPLETED, DOCUMENT_VALIDATED    |
| REJECTED (OTHER)                 | DATA             | STARTED, DATA_COMPLETED                        |
| EXPIRED (INCOMPLETE / ABANDONED) | START o DATA     | STARTED [, DATA_COMPLETED]                     |

## Semilla determinista (PLAN §11)

- PRNG `mulberry32` con semilla fija `20261001`; 60 días de datos (30 días visibles + 30 de comparativa).
- ≈ 12.900 solicitudes en los últimos 30 días; Digital ~70 %, Oficina ~20 %, Partner ~10 %.
- Partner con peor conversión, más rechazos y duraciones mayores.
- Rechazos por verificación crecientes en el tiempo para que el error de verificación suba > 20 % en 30 y 7 días.
- Fixtures fijos en los últimos minutos (`CL-10481`…`CL-10510`): ≥ 10 activas próximas a SLA (121–180 s),
  ≥ 10 activas fuera de SLA (≥ 181 s), `CL-10481` completada con timeline completo, `CL-10483` activa a 2 min 30 s
  y `CL-10484` activa a 3 min 01 s (C-001-20).
- Ningún campo de texto libre: no hay nombres, documentos, teléfonos ni correos.
