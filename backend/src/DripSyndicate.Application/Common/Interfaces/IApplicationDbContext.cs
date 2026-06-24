using DripSyndicate.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace DripSyndicate.Application.Common.Interfaces;

/// <summary>Abstraction over the EF Core DbContext so the Application layer stays infra-agnostic.</summary>
public interface IApplicationDbContext
{
    DbSet<User> Users { get; }
    DbSet<Role> Roles { get; }
    DbSet<UserRole> UserRoles { get; }
    DbSet<RefreshToken> RefreshTokens { get; }
    DbSet<Category> Categories { get; }
    DbSet<Product> Products { get; }
    DbSet<ProductVariant> ProductVariants { get; }
    DbSet<ProductImage> ProductImages { get; }
    DbSet<CartItem> CartItems { get; }
    DbSet<WishlistItem> WishlistItems { get; }
    DbSet<Order> Orders { get; }
    DbSet<OrderItem> OrderItems { get; }
    DbSet<Payment> Payments { get; }
    DbSet<Review> Reviews { get; }
    DbSet<ContactMessage> ContactMessages { get; }
    DbSet<MediaAsset> MediaAssets { get; }
    DbSet<Banner> Banners { get; }
    DbSet<PromoVideo> PromoVideos { get; }

    Task<int> SaveChangesAsync(CancellationToken ct = default);
}
