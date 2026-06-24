# Command Reference

Every command you need, grouped by tool. Run them from the repo root unless a
`cd` is shown.

## Quick start (everything, via Docker)

```bash
# Build and start Postgres + API + storefront
docker compose up -d --build

# Storefront  → http://localhost:3000
# API/Swagger → http://localhost:8080/swagger
# Health      → http://localhost:8080/health

docker compose logs -f backend     # tail API logs
docker compose down                # stop (keep data)
docker compose down -v             # stop and wipe the database volume
```

Seeded admin login: `admin@dripsyndicate.com` / `Admin@12345!`.

## Frontend (Next.js)

```bash
cd frontend
cp .env.local.example .env.local   # set NEXT_PUBLIC_API_URL
npm install                        # install dependencies
npm run dev                        # dev server on http://localhost:3000
npm run lint                       # eslint
npm run typecheck                  # tsc --noEmit
npm run build                      # production build
npm start                          # serve the production build
```

## Backend (ASP.NET Core 9)

```bash
cd backend
dotnet restore                     # restore NuGet packages
dotnet build                       # compile the whole solution
dotnet test                        # run the xUnit test suite

# run the API (defaults to http://localhost:8080)
dotnet run --project src/DripSyndicate.API
```

### EF Core migrations

```bash
cd backend

# apply all migrations to the configured database
dotnet ef database update \
  --project src/DripSyndicate.Infrastructure \
  --startup-project src/DripSyndicate.API

# create a new migration after changing entities
dotnet ef migrations add YourChangeName \
  --project src/DripSyndicate.Infrastructure \
  --startup-project src/DripSyndicate.API \
  --output-dir Persistence/Migrations
```

> Migrations also run automatically at API startup, so for local Docker you
> normally don't need to run these by hand.

## Docker (individual images)

```bash
# Backend
docker build -t drip-backend ./backend
docker run --rm -p 8080:8080 \
  -e ConnectionStrings__Default="Host=host.docker.internal;Port=5432;Database=dripsyndicate;Username=postgres;Password=postgres" \
  -e Jwt__Secret="local_dev_secret_change_me_at_least_32_chars_0123456789" \
  drip-backend

# Frontend (NEXT_PUBLIC_API_URL is a build arg — baked into the bundle)
docker build -t drip-frontend \
  --build-arg NEXT_PUBLIC_API_URL=http://localhost:8080/api/v1 \
  ./frontend
docker run --rm -p 3000:3000 drip-frontend
```

## Kubernetes

Apply manifests in dependency order (namespace first):

```bash
kubectl apply -f k8s/namespace.yaml
kubectl apply -f k8s/configmap.yaml
kubectl apply -f k8s/secret.yaml          # edit real values first!
kubectl apply -f k8s/backend-deployment.yaml
kubectl apply -f k8s/backend-service.yaml
kubectl apply -f k8s/frontend-deployment.yaml
kubectl apply -f k8s/frontend-service.yaml
kubectl apply -f k8s/ingress.yaml
kubectl apply -f k8s/hpa.yaml

# …or apply the whole folder at once
kubectl apply -f k8s/

# inspect
kubectl get pods -n drip-syndicate
kubectl get svc,ingress,hpa -n drip-syndicate
kubectl logs -n drip-syndicate deploy/backend -f
kubectl rollout status -n drip-syndicate deploy/backend

# update an image after pushing a new tag
kubectl set image -n drip-syndicate deploy/backend \
  backend=ghcr.io/OWNER/drip-syndicate-backend:NEW_SHA
```

> Replace `ghcr.io/OWNER/...` with your real GHCR owner/repo, and fill in
> `k8s/secret.yaml` with real credentials (never commit them).
