# Despliegue en AWS (ECS Fargate)

La imagen (`Dockerfile` en la raíz de `onboarding-control-tower/`) contiene la API Fastify, el frontend compilado y una
base de datos SQLite de solo lectura con el seed determinista, que se genera durante el build. Un solo contenedor sirve
todo en el puerto 3000 y responde a `/api/health`.

La plantilla [`ecs-fargate.yaml`](ecs-fargate.yaml) (CloudFormation) crea:

- Un clúster ECS con Container Insights y un log group de CloudWatch (30 días de retención).
- La definición de tarea Fargate (512 CPU / 1024 MiB por defecto), con health check del contenedor, y los roles IAM.
- El servicio ECS con circuit breaker y rollback automático.
- Un Application Load Balancer público con target group sobre `/api/health`. Escucha en HTTP y, si se pasa
  `CertificateArn`, también en HTTPS (TLS 1.2/1.3), redirigiendo HTTP a HTTPS.
- Los security groups: el balanceador solo admite tráfico desde `AllowedCidr` y las tareas solo desde el balanceador.

## Requisitos

- AWS CLI v2 con credenciales que puedan gestionar ECR, ECS, ELB, EC2 (security groups), IAM y CloudWatch Logs.
- Docker.
- Una VPC con al menos dos subredes públicas para el balanceador. Las tareas pueden ir en subredes privadas con NAT o
  en las públicas con `AssignPublicIp=ENABLED`.

## Pasos

```bash
export AWS_REGION=eu-west-1
export ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
export REPO=onboarding-control-tower
export TAG=1.0.0
export IMAGE_URI=$ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$REPO:$TAG

# 1. Repositorio ECR (solo la primera vez)
aws ecr create-repository --repository-name $REPO --image-scanning-configuration scanOnPush=true \
  --image-tag-mutability IMMUTABLE

# 2. Construir y subir la imagen (desde onboarding-control-tower/)
aws ecr get-login-password | docker login --username AWS --password-stdin $ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com
docker build --platform linux/amd64 -t $IMAGE_URI .
docker push $IMAGE_URI

# 3. Desplegar o actualizar el stack
aws cloudformation deploy \
  --stack-name onboarding-control-tower \
  --template-file deploy/aws/ecs-fargate.yaml \
  --capabilities CAPABILITY_IAM \
  --parameter-overrides \
    VpcId=vpc-xxxxxxxx \
    LoadBalancerSubnetIds=subnet-aaaa,subnet-bbbb \
    ServiceSubnetIds=subnet-cccc,subnet-dddd \
    ImageUri=$IMAGE_URI

# 4. URL de la aplicación
aws cloudformation describe-stacks --stack-name onboarding-control-tower \
  --query "Stacks[0].Outputs[?OutputKey=='ApplicationUrl'].OutputValue" --output text
```

Para publicar una versión nueva, sube la imagen con otro `TAG` y vuelve a ejecutar el paso 3 con el nuevo `ImageUri`.
ECS hace un despliegue rolling y, si las tareas nuevas no pasan el health check, vuelve a la versión anterior.

## Parámetros opcionales

| Parámetro        | Por defecto  | Uso                                                                     |
| ---------------- | ------------ | ----------------------------------------------------------------------- |
| `CertificateArn` | vacío        | Certificado de ACM para HTTPS en el puerto 443.                         |
| `AllowedCidr`    | `0.0.0.0/0`  | Restringe el acceso al balanceador (p. ej. a la red corporativa).       |
| `AssignPublicIp` | `DISABLED`   | `ENABLED` si las tareas van en subredes públicas sin NAT.               |
| `DesiredCount`   | `1`          | Número de tareas. Cada una lleva su copia de los datos de solo lectura. |
| `Cpu` / `Memory` | `512`/`1024` | Tamaño de la tarea Fargate.                                             |
| `ReferenceNow`   | vacío        | Instante de referencia de la demo (ADR-04), en ISO 8601.                |

## Probar la imagen en local

```bash
docker build -t onboarding-control-tower:local .
docker run --rm -p 3000:3000 onboarding-control-tower:local
curl http://localhost:3000/api/health
```

## Limpieza

```bash
aws cloudformation delete-stack --stack-name onboarding-control-tower
aws ecr delete-repository --repository-name $REPO --force
```
