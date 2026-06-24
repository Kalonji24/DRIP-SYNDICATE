using System.Reflection;
using DripSyndicate.Application.Common.Interfaces;
using DripSyndicate.Domain.Common;
using DripSyndicate.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace DripSyndicate.Infrastructure.Persistence;

public class ApplicationDbContext : DbContext, IApplicationDbContext
{
    public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options) : base(options) { }

    public DbSet<User> Users => Set<User>();
    public DbSet<Role> Roles => Set<Role>();
    public DbSet<UserRole> UserRoles => Set<UserRole>();
    public DbSet<RefreshToken> RefreshTokens => Set<RefreshToken>();
    public DbSet<Category> Categories => Set<Category>();
    public DbSet<Product> Products => Set<Product>();
    public DbSet<ProductVariant> ProductVariants => Set<ProductVariant>();
    public DbSet<ProductImage> ProductImages => Set<ProductImage>();
    public DbSet<CartItem> CartItems => Set<CartItem>();
    public DbSet<WishlistItem> WishlistItems => Set<WishlistItem>();
    public DbSet<Order> Orders => Set<Order>();
    public DbSet<OrderItem> OrderItems => Set<OrderItem>();
    public DbSet<Payment> Payments => Set<Payment>();
    public DbSet<Review> Reviews => Set<Review>();
    public DbSet<ContactMessage> ContactMessages => Set<ContactMessage>();
    public DbSet<MediaAsset> MediaAssets => Set<MediaAsset>();
    public DbSet<Banner> Banners => Set<Banner>();
    public DbSet<PromoVideo> PromoVideos => Set<PromoVideo>();

    protected override void OnModelCreating(ModelBuilder builder)
    {
        builder.ApplyConfigurationsFromAssembly(Assembly.GetExecutingAssembly());

        // Global soft-delete filter on all BaseEntity tables
        foreach (var entityType in builder.Model.GetEntityTypes())
        {
            if (typeof(BaseEntity).IsAssignableFrom(entityType.ClrType))
            {
                var method = typeof(ApplicationDbContext)
                    .GetMethod(nameof(SetSoftDeleteFilter), BindingFlags.NonPublic | BindingFlags.Static)!
                    .MakeGenericMethod(entityType.ClrType);
                method.Invoke(null, new object[] { builder });
            }
        }
        base.OnModelCreating(builder);
    }

    private static void SetSoftDeleteFilter<TEntity>(ModelBuilder builder) where TEntity : BaseEntity
        => builder.Entity<TEntity>().HasQueryFilter(e => e.DeletedAt == null);

    public override Task<int> SaveChangesAsync(CancellationToken ct = default)
    {
        foreach (var entry in ChangeTracker.Entries<BaseEntity>())
        {
            if (entry.State == EntityState.Modified) entry.Entity.UpdatedAt = DateTime.UtcNow;
            if (entry.State == EntityState.Added && entry.Entity.CreatedAt == default)
                entry.Entity.CreatedAt = DateTime.UtcNow;
        }
        return base.SaveChangesAsync(ct);
    }
}
