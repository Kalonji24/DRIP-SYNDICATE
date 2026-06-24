using DripSyndicate.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace DripSyndicate.Infrastructure.Persistence.Configurations;

public class UserConfig : IEntityTypeConfiguration<User>
{
    public void Configure(EntityTypeBuilder<User> b)
    {
        b.ToTable("users");
        b.HasIndex(x => x.Email).IsUnique();
        b.Property(x => x.Email).HasMaxLength(256).IsRequired();
        b.Property(x => x.FullName).HasMaxLength(120).IsRequired();
        b.Property(x => x.Status).HasMaxLength(20);
        b.HasMany(x => x.UserRoles).WithOne(x => x.User).HasForeignKey(x => x.UserId);
        b.HasMany(x => x.RefreshTokens).WithOne(x => x.User).HasForeignKey(x => x.UserId);
    }
}

public class RoleConfig : IEntityTypeConfiguration<Role>
{
    public void Configure(EntityTypeBuilder<Role> b)
    {
        b.ToTable("roles");
        b.HasIndex(x => x.Name).IsUnique();
        b.Property(x => x.Name).HasMaxLength(50).IsRequired();
    }
}

public class UserRoleConfig : IEntityTypeConfiguration<UserRole>
{
    public void Configure(EntityTypeBuilder<UserRole> b)
    {
        b.ToTable("user_roles");
        b.HasKey(x => new { x.UserId, x.RoleId });
        b.HasOne(x => x.Role).WithMany(x => x.UserRoles).HasForeignKey(x => x.RoleId);
    }
}

public class RefreshTokenConfig : IEntityTypeConfiguration<RefreshToken>
{
    public void Configure(EntityTypeBuilder<RefreshToken> b)
    {
        b.ToTable("refresh_tokens");
        b.HasIndex(x => x.TokenHash);
        b.Property(x => x.TokenHash).IsRequired();
    }
}

public class CategoryConfig : IEntityTypeConfiguration<Category>
{
    public void Configure(EntityTypeBuilder<Category> b)
    {
        b.ToTable("categories");
        b.HasIndex(x => x.Slug).IsUnique();
        b.Property(x => x.Name).HasMaxLength(120).IsRequired();
        b.HasOne(x => x.Parent).WithMany(x => x.Children).HasForeignKey(x => x.ParentId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}

public class ProductConfig : IEntityTypeConfiguration<Product>
{
    public void Configure(EntityTypeBuilder<Product> b)
    {
        b.ToTable("products");
        b.HasIndex(x => x.Slug).IsUnique();
        b.HasIndex(x => new { x.Status, x.PublishedAt });
        b.Property(x => x.Name).HasMaxLength(200).IsRequired();
        b.Property(x => x.Price).HasPrecision(12, 2);
        b.Property(x => x.Currency).HasMaxLength(3);
        b.HasOne(x => x.Category).WithMany(x => x.Products).HasForeignKey(x => x.CategoryId)
            .OnDelete(DeleteBehavior.Restrict);
        b.HasMany(x => x.Variants).WithOne(x => x.Product).HasForeignKey(x => x.ProductId);
        b.HasMany(x => x.Images).WithOne(x => x.Product).HasForeignKey(x => x.ProductId);
    }
}

public class ProductVariantConfig : IEntityTypeConfiguration<ProductVariant>
{
    public void Configure(EntityTypeBuilder<ProductVariant> b)
    {
        b.ToTable("product_variants");
        b.HasIndex(x => x.Sku).IsUnique();
        b.Property(x => x.Sku).HasMaxLength(64).IsRequired();
        b.Property(x => x.Price).HasPrecision(12, 2);
        b.Ignore(x => x.Available);
        b.ToTable(t => t.HasCheckConstraint("ck_no_oversell", "\"StockOnHand\" - \"StockReserved\" >= 0"));
    }
}

public class ProductImageConfig : IEntityTypeConfiguration<ProductImage>
{
    public void Configure(EntityTypeBuilder<ProductImage> b) => b.ToTable("product_images");
}

public class CartItemConfig : IEntityTypeConfiguration<CartItem>
{
    public void Configure(EntityTypeBuilder<CartItem> b)
    {
        b.ToTable("cart_items");
        b.HasIndex(x => new { x.UserId, x.ProductVariantId }).IsUnique();
        b.HasOne(x => x.ProductVariant).WithMany().HasForeignKey(x => x.ProductVariantId);
    }
}

public class WishlistItemConfig : IEntityTypeConfiguration<WishlistItem>
{
    public void Configure(EntityTypeBuilder<WishlistItem> b)
    {
        b.ToTable("wishlist_items");
        b.HasIndex(x => new { x.UserId, x.ProductId }).IsUnique();
        b.HasOne(x => x.Product).WithMany().HasForeignKey(x => x.ProductId);
    }
}

public class OrderConfig : IEntityTypeConfiguration<Order>
{
    public void Configure(EntityTypeBuilder<Order> b)
    {
        b.ToTable("orders");
        b.HasIndex(x => x.Number).IsUnique();
        b.HasIndex(x => new { x.UserId, x.CreatedAt });
        foreach (var p in new[] { "Subtotal", "Discount", "Shipping", "Tax", "Total" })
            b.Property(p).HasPrecision(12, 2);
        b.Property(x => x.Currency).HasMaxLength(3);
        b.HasMany(x => x.Items).WithOne(x => x.Order).HasForeignKey(x => x.OrderId);
        b.HasOne(x => x.Payment).WithOne(x => x.Order).HasForeignKey<Payment>(x => x.OrderId);
    }
}

public class OrderItemConfig : IEntityTypeConfiguration<OrderItem>
{
    public void Configure(EntityTypeBuilder<OrderItem> b)
    {
        b.ToTable("order_items");
        b.Property(x => x.UnitPrice).HasPrecision(12, 2);
        b.Property(x => x.LineTotal).HasPrecision(12, 2);
    }
}

public class PaymentConfig : IEntityTypeConfiguration<Payment>
{
    public void Configure(EntityTypeBuilder<Payment> b)
    {
        b.ToTable("payments");
        b.Property(x => x.Amount).HasPrecision(12, 2);
        b.HasIndex(x => new { x.Provider, x.IntentId });
    }
}

public class ReviewConfig : IEntityTypeConfiguration<Review>
{
    public void Configure(EntityTypeBuilder<Review> b)
    {
        b.ToTable("reviews");
        b.HasIndex(x => new { x.UserId, x.ProductId }).IsUnique();
        b.HasIndex(x => new { x.ProductId, x.CreatedAt });
        b.HasOne(x => x.Product).WithMany(x => x.Reviews).HasForeignKey(x => x.ProductId);
        b.HasOne(x => x.User).WithMany(x => x.Reviews).HasForeignKey(x => x.UserId);
    }
}

public class ContactMessageConfig : IEntityTypeConfiguration<ContactMessage>
{
    public void Configure(EntityTypeBuilder<ContactMessage> b) => b.ToTable("contact_messages");
}

public class MediaAssetConfig : IEntityTypeConfiguration<MediaAsset>
{
    public void Configure(EntityTypeBuilder<MediaAsset> b)
    {
        b.ToTable("media_assets");
        b.HasIndex(x => x.Path);
        b.Property(x => x.Path).IsRequired();
    }
}

public class BannerConfig : IEntityTypeConfiguration<Banner>
{
    public void Configure(EntityTypeBuilder<Banner> b) => b.ToTable("banners");
}

public class PromoVideoConfig : IEntityTypeConfiguration<PromoVideo>
{
    public void Configure(EntityTypeBuilder<PromoVideo> b) => b.ToTable("promo_videos");
}
