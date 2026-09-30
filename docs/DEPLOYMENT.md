# KAN-5 - Despliegue operativo

## 1. Ejecución local con Docker (sin configuración)

```bash
docker compose up --build -d
./scripts/smoke-test.sh          # health + UI + POST /api/claims (201) + validación (400)
```

- Frontend: http://localhost:3000/claims/new
- API / Swagger: http://localhost:5284/swagger
- Health: http://localhost:5284/health

El frontend llama a `/api` en su mismo origen y Next.js lo reenvía a `claims-api:8080`
(`API_PROXY_TARGET`, fijado en build). El almacenamiento es en memoria: reiniciar el API borra los siniestros.

## 2. Pipeline CI/CD (`.github/workflows/kan-5-ci-cd.yml`)

| Job | PR | Push a `main` |
|---|---|---|
| build | .NET + Next.js | igual |
| test | xUnit + lint | igual |
| security | Snyk SCA (falla con vulnerabilidades `high`+) | igual |
| docker | Build de imágenes + smoke test con docker compose | + push a GHCR (`:<sha>` y `:latest`) |
| deploy | - | `kubectl apply` de `k8s/` en AKS + `rollout status` |

`security` y `deploy` se saltan con un warning si falta su configuración; el resto funciona sin secretos.

## 3. Configuración del repositorio (Settings -> Secrets and variables -> Actions)

| Tipo | Nombre | Uso |
|---|---|---|
| Secret | `SNYK_TOKEN` | Token de https://app.snyk.io/account |
| Secret | `AZURE_CREDENTIALS` | JSON del service principal (ver abajo) |
| Secret (opcional) | `GHCR_PULL_TOKEN` | PAT con `read:packages` si los paquetes GHCR son privados |
| Variable | `AKS_CLUSTER_NAME` | Nombre del clúster AKS |
| Variable | `AKS_RESOURCE_GROUP` | Resource group del clúster |

Crear el environment `production` (Settings -> Environments) y, si se quiere aprobación manual, añadir *Required reviewers*.

Service principal con permisos mínimos sobre el clúster:

```bash
AKS_ID=$(az aks show -g <resource-group> -n <cluster> --query id -o tsv)
az ad sp create-for-rbac --name github-claims-deploy \
  --role "Azure Kubernetes Service Cluster User Role" --scopes "$AKS_ID" --json-auth
az role assignment create --assignee <appId> \
  --role "Azure Kubernetes Service RBAC Writer" --scope "$AKS_ID"   # solo si el clúster usa Azure RBAC
```

Pegar la salida JSON de `create-for-rbac` en el secret `AZURE_CREDENTIALS`.

## 4. Kubernetes (`k8s/`)

- Namespace `claims`.
- `claims-api`: Deployment + Service `ClusterIP:8080`, probes en `/health`.
- `claims-frontend`: Deployment + Service `LoadBalancer:80` (IP pública en AKS), probes en `/claims/new`.

Despliegue manual en cualquier clúster:

```bash
kubectl apply -k k8s/     # usa imágenes claims-api:local / claims-frontend:local
```

En el pipeline las imágenes se sustituyen por `ghcr.io/<owner>/claims-*:<sha>`. La URL pública aparece en el *summary* del job `deploy`.
