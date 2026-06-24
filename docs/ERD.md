# DRIP Syndicate — Entity Relationship Diagram

The schema is PostgreSQL (Supabase). Tables use `snake_case` names; columns are
`PascalCase` (matching the EF Core entities). Every table inherits the audit
columns `Id (uuid, pk)`, `CreatedAt`, `UpdatedAt`, and `DeletedAt` (soft delete)
from `BaseEntity`, except the pure join table `user_roles`.

```mermaid
erDiagram
    users ||--o{ user_roles : has
    roles ||--o{ user_roles : grants
    users ||--o{ refresh_tokens : owns
    users ||--o{ orders : places
    users ||--o{ reviews : writes
    users ||--o{ cart_items : holds
    users ||--o{ wishlist_items : saves

    categories ||--o{ categories : parent_of
    categories ||--o{ products : contains
    products ||--o{ product_variants : has
    products ||--o{ product_images : has
    products ||--o{ reviews : receives
    products ||--o{ wishlist_items : referenced_by

    product_variants ||--o{ cart_items : added_as
    orders ||--o{ order_items : contains
    orders ||--|| payments : settled_by

    users {
        uuid Id PK
        text Email UK
        text PasswordHash
        text FullName
        text Phone
        bool EmailVerified
        text Status
        text PasswordResetTokenHash
        timestamptz PasswordResetExpiresAt
    }
    roles {
        uuid Id PK
        text Name UK
        text Description
    }
    user_roles {
        uuid UserId PK_FK
        uuid RoleId PK_FK
    }
    refresh_tokens {
        uuid Id PK
        uuid UserId FK
        text TokenHash
        timestamptz ExpiresAt
        timestamptz RevokedAt
        text ReplacedByTokenHash
    }
    categories {
        uuid Id PK
        text Name
        text Slug UK
        text Description
        uuid ParentId FK
        text ImageUrl
        int Position
    }
    products {
        uuid Id PK
        text Name
        text Slug UK
        text Description
        numeric Price
        text Currency
        int Status
        uuid CategoryId FK
        bool IsFeatured
        timestamptz PublishedAt
        float RatingAverage
        int RatingCount
    }
    product_variants {
        uuid Id PK
        uuid ProductId FK
        text Sku UK
        text Size
        text Color
        numeric Price
        int StockOnHand
        int StockReserved
    }
    product_images {
        uuid Id PK
        uuid ProductId FK
        text Url
        text ThumbnailUrl
        int Position
        text Alt
    }
    cart_items {
        uuid Id PK
        uuid UserId FK
        uuid ProductVariantId FK
        int Quantity
    }
    wishlist_items {
        uuid Id PK
        uuid UserId FK
        uuid ProductId FK
    }
    orders {
        uuid Id PK
        text Number UK
        uuid UserId FK
        int Status
        numeric Subtotal
        numeric Discount
        numeric Shipping
        numeric Tax
        numeric Total
        text Currency
        text ShipFullName
        text Email
    }
    order_items {
        uuid Id PK
        uuid OrderId FK
        uuid ProductVariantId
        text NameSnapshot
        text SkuSnapshot
        numeric UnitPrice
        int Quantity
        numeric LineTotal
    }
    payments {
        uuid Id PK
        uuid OrderId FK
        text Provider
        text IntentId
        int Status
        numeric Amount
        text Currency
    }
    reviews {
        uuid Id PK
        uuid ProductId FK
        uuid UserId FK
        int Rating
        text Title
        text Body
        bool IsApproved
        bool VerifiedPurchase
    }
    contact_messages {
        uuid Id PK
        text Name
        text Email
        text Subject
        text Message
        bool IsHandled
    }
    media_assets {
        uuid Id PK
        text Bucket
        text Path
        text Url
        text ThumbnailUrl
        int Type
        int Scope
        bigint SizeBytes
        int Width
        int Height
        uuid OwnerEntityId
    }
    banners {
        uuid Id PK
        text Title
        text Subtitle
        text ImageUrl
        text LinkUrl
        int Position
        bool IsActive
    }
    promo_videos {
        uuid Id PK
        text Title
        text VideoUrl
        text PosterUrl
        bool IsActive
        int Position
    }
```

## Notes & invariants

- **Soft deletes.** A global EF query filter excludes rows where `DeletedAt`
  is not null; deletes set the timestamp instead of removing the row.
- **No oversell.** `product_variants` carries a `CHECK ("StockOnHand" -
  "StockReserved" >= 0)` constraint (`ck_no_oversell`). Checkout decrements
  stock inside a transaction so the database refuses to go negative.
- **`order_items.ProductVariantId`** is stored as a plain `uuid` with **no FK**
  on purpose: line items are immutable snapshots and must survive a variant
  being deleted. `NameSnapshot` / `SkuSnapshot` / `UnitPrice` freeze the sale.
- **Tokens are hashed.** `refresh_tokens.TokenHash` and
  `users.PasswordResetTokenHash` store SHA-256 hashes, never raw secrets.
- **Unique indexes:** `users.Email`, `roles.Name`, `categories.Slug`,
  `products.Slug`, `product_variants.Sku`, `orders.Number`,
  `(user_id, product_variant_id)` on `cart_items`,
  `(user_id, product_id)` on `wishlist_items`.
