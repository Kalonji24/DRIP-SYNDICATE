using DripSyndicate.Domain.Entities;
using DripSyndicate.Domain.Enums;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

namespace DripSyndicate.Infrastructure.Persistence.Seed;

/// <summary>Idempotent seed: roles, an admin user, categories, and a few DRIP Syndicate products.</summary>
public static class DbSeeder
{
    public static async Task SeedAsync(IServiceProvider sp)
    {
        using var scope = sp.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
        var hasher = scope.ServiceProvider
            .GetRequiredService<Application.Common.Interfaces.IPasswordHasher>();

        await db.Database.MigrateAsync();

        // Roles
        var roleNames = new[] { "admin", "customer", "support", "catalog" };
        foreach (var rn in roleNames)
            if (!await db.Roles.AnyAsync(r => r.Name == rn))
                db.Roles.Add(new Role { Name = rn, Description = $"{rn} role" });
        await db.SaveChangesAsync();

        // Admin user
        if (!await db.Users.AnyAsync(u => u.Email == "admin@dripsyndicate.com"))
        {
            var admin = new User
            {
                Email = "admin@dripsyndicate.com",
                FullName = "DRIP Admin",
                EmailVerified = true,
                PasswordHash = hasher.Hash("Admin@12345!")
            };
            db.Users.Add(admin);
            await db.SaveChangesAsync();
            var adminRole = await db.Roles.FirstAsync(r => r.Name == "admin");
            db.UserRoles.Add(new UserRole { UserId = admin.Id, RoleId = adminRole.Id });
            await db.SaveChangesAsync();
        }

        // Categories
        if (!await db.Categories.AnyAsync())
        {
            db.Categories.AddRange(
                new Category { Name = "Hoodies", Slug = "hoodies", Position = 1 },
                new Category { Name = "Tees", Slug = "tees", Position = 2 },
                new Category { Name = "Sneakers", Slug = "sneakers", Position = 3 });
            await db.SaveChangesAsync();
        }

        // Products
        if (!await db.Products.AnyAsync())
        {
            var hoodies = await db.Categories.FirstAsync(c => c.Slug == "hoodies");
            var tees = await db.Categories.FirstAsync(c => c.Slug == "tees");
            var sneakers = await db.Categories.FirstAsync(c => c.Slug == "sneakers");

            Product P(string name, string slug, decimal price, Category cat, bool featured) => new()
            {
                Name = name, Slug = slug, Price = price, Currency = "ZAR",
                CategoryId = cat.Id, Status = ProductStatus.Active, IsFeatured = featured,
                PublishedAt = DateTime.UtcNow,
                Description = $"{name} — Street. Power. Identity."
            };

            var p1 = P("Street Hoodie", "street-hoodie", 1390m, hoodies, true);
            var p2 = P("Graphic Tee", "graphic-tee", 790m, tees, true);
            var p3 = P("Urban Sneakers", "urban-sneakers", 2100m, sneakers, true);
            var p4 = P("Red Drip Sneakers", "red-drip-sneakers", 2450m, sneakers, true);
            db.Products.AddRange(p1, p2, p3, p4);
            await db.SaveChangesAsync();

            foreach (var (p, skuBase) in new[] { (p1, "HOODIE"), (p2, "TEE"), (p3, "SNK"), (p4, "RED") })
                foreach (var size in new[] { "S", "M", "L", "XL" })
                    db.ProductVariants.Add(new ProductVariant
                    {
                        ProductId = p.Id, Sku = $"{skuBase}-BLK-{size}",
                        Size = size, Color = "Black", Price = p.Price, StockOnHand = 50
                    });
            await db.SaveChangesAsync();
        }

        // Banner
        if (!await db.Banners.AnyAsync())
        {
            db.Banners.Add(new Banner
            {
                Title = "BLACKOUT VOL.3", Subtitle = "Street. Power. Identity.",
                ImageUrl = "https://placehold.co/1600x600/16181D/C81D25?text=BLACKOUT+VOL.3",
                LinkUrl = "/drops", Position = 1, IsActive = true
            });
            await db.SaveChangesAsync();
        }
    }
}
