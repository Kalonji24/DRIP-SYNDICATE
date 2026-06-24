# Database Guide

- **Engine:** PostgreSQL 16 (Supabase in production, `postgres:16-alpine` locally).
- **ORM:** Entity Framework Core 9 (Npgsql provider).
- **Migrations live in:** `backend/src/DripSyndicate.Infrastructure/Persistence/Migrations`.

## How the schema is created

You never hand-write DDL. EF Core owns the schema through migrations. The
initial migration `20260601000000_InitialCreate` builds every table, index,
foreign key and the `ck_no_oversell` check constraint.

Migrations are applied **automatically at API startup** by the seeder
(`DbSeeder.SeedAsync` calls `Database.MigrateAsync()`), so a fresh database is
brought fully up to date the first time the backend boots. You can also apply
them manually:

```bash
cd backend
dotnet ef database update \
  --project src/DripSyndicate.Infrastructure \
  --startup-project src/DripSyndicate.API
```

## Creating a new migration

After changing an entity or its configuration:

```bash
cd backend
dotnet ef migrations add DescribeYourChange \
  --project src/DripSyndicate.Infrastructure \
  --startup-project src/DripSyndicate.API \
  --output-dir Persistence/Migrations
```

Review the generated `Up`/`Down` methods, commit them, and they will apply on
the next deploy.

## Tables

| Table | Purpose |
|-------|---------|
| `users` | Accounts. Hashed password, reset token, `Status` lifecycle. |
| `roles` / `user_roles` | RBAC. Seeded roles: `admin`, `customer`, `support`, `catalog`. |
| `refresh_tokens` | Hashed, rotating refresh tokens for JWT renewal. |
| `categories` | Self-referencing tree (`ParentId`). |
| `products` | Catalogue entries with denormalised rating + featured flag. |
| `product_variants` | Sellable SKUs (size/colour/price/stock). Stock guard lives here. |
| `product_images` | Ordered gallery per product. |
| `cart_items` | Per-user cart, keyed by variant. Unique `(UserId, ProductVariantId)`. |
| `wishlist_items` | Per-user saved products. Unique `(UserId, ProductId)`. |
| `orders` / `order_items` | Orders with immutable line-item snapshots. |
| `payments` | One row per order; provider + status + captured amount. |
| `reviews` | 1–5 ratings, approval + verified-purchase flags. |
| `contact_messages` | Contact-form submissions. |
| `media_assets` | Every Supabase Storage object (image/video/thumbnail) + scope. |
| `banners` | Homepage hero banners. |
| `promo_videos` | Promotional videos. |

## Seed data

On first boot (`Seed:Enabled = true`) the seeder creates:

- The four roles above.
- An admin account: **`admin@dripsyndicate.com` / `Admin@12345!`** — change this immediately in any real environment.
- Starter categories (hoodies, tees, sneakers), four products with S/M/L/XL
  variants (50 units each), and one homepage banner.

## Money & types

- All monetary columns are `numeric(12,2)`.
- Enums (`Status`, `OrderStatus`, `PaymentStatus`, media `Type`/`Scope`) are
  stored as `int`.
- Timestamps are `timestamptz` (UTC). The app sets `CreatedAt`/`UpdatedAt`
  automatically in `SaveChangesAsync`.
