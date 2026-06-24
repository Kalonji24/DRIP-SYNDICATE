# DRIP Syndicate

A production-ready, full-stack e-commerce platform for a drop-based streetwear
brand. Built as a monorepo: a **Next.js 15** storefront + admin, an **ASP.NET
Core 9** API on a Clean Architecture, **PostgreSQL** (Supabase) for data, and
**Supabase Storage** for media. Ships with Docker, Kubernetes, and CI/CD.

## Stack

| Layer | Tech |
|-------|------|
| Frontend | Next.js 15 (App Router), TypeScript, Tailwind CSS, Zustand, Axios |
| Backend | ASP.NET Core 9, EF Core 9, Clean Architecture, JWT auth, FluentValidation, Serilog |
| Database | PostgreSQL 16 (Supabase) |
| Media | Supabase Storage + ImageSharp (resize / thumbnail / crop) |
| DevOps | Docker, Docker Compose, Kubernetes, GitHub Actions, Render |

## Features

**Storefront** — registration, login, forgot/reset password, catalogue with
category filters / sort / search, product detail with variants + reviews, cart,
wishlist, checkout (15% VAT + flat shipping), order history, contact form.

**Admin** (`/admin`, staff roles only) — dashboard with revenue analytics,
product CRUD with variants and stock control, category CRUD, order management
with status transitions, inventory with low-stock view, user/role management,
and a **media center** (upload images/videos, replace, delete, server-side
crop/resize/thumbnails, homepage banners, promo videos).

**Security** — JWT access + rotating refresh tokens (hashed at rest), BCrypt
password hashing, role-based authorization (`admin` / `support` / `catalog`),
request rate limiting, FluentValidation on inputs, EF parameterised queries
(SQLi-safe), and defence-in-depth HTTP headers.

## Quick start

```bash
docker compose up -d --build
```

- Storefront → http://localhost:3000
- API + Swagger → http://localhost:8080/swagger
- Seeded admin → `admin@dripsyndicate.com` / `Admin@12345!`

See **[docs/COMMANDS.md](docs/COMMANDS.md)** for running each part on its own.

## Repository layout

```
drip-syndicate/
├── backend/           ASP.NET Core 9 solution (Clean Architecture)
│   └── src/
│       ├── DripSyndicate.Domain          entities, enums, base types
│       ├── DripSyndicate.Application      DTOs, validators, interfaces
│       ├── DripSyndicate.Infrastructure  EF Core, identity, storage, seed
│       └── DripSyndicate.API             controllers, middleware, Program.cs
│   └── tests/         xUnit unit tests
├── frontend/          Next.js 15 app (storefront + admin)
│   └── src/
│       ├── app/        routes (storefront pages + /admin)
│       ├── components/ UI + admin primitives
│       ├── lib/        axios client, formatters, server fetch
│       ├── store/      Zustand auth + cart
│       └── types/      shared API types
├── k8s/               Kubernetes manifests (namespace, deploys, ingress, HPA)
├── .github/workflows/ CI/CD pipeline
├── docker-compose.yml full local stack
└── docs/              ERD, database, deployment, commands
```

## Documentation

- [docs/ERD.md](docs/ERD.md) — entity relationship diagram + invariants
- [docs/DATABASE.md](docs/DATABASE.md) — schema, migrations, seed data
- [docs/RENDER_DEPLOYMENT.md](docs/RENDER_DEPLOYMENT.md) — deploy to Render + Supabase
- [docs/COMMANDS.md](docs/COMMANDS.md) — every command, by tool

## Configuration

Copy `.env.example` and fill in values. The backend reads configuration from
environment variables (double-underscore maps to nested keys, e.g.
`Jwt__Secret`). The frontend needs `NEXT_PUBLIC_API_URL` at **build** time
because it is inlined into the client bundle.

## License

Proprietary — built by Softwise Solutions. All rights reserved.
