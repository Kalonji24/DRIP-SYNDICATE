using DripSyndicate.Domain.Common;
using DripSyndicate.Domain.Enums;

namespace DripSyndicate.Domain.Entities;

public class Category : BaseEntity
{
    public string Name { get; set; } = default!;
    public string Slug { get; set; } = default!;
    public string? Description { get; set; }
    public Guid? ParentId { get; set; }
    public Category? Parent { get; set; }
    public ICollection<Category> Children { get; set; } = new List<Category>();
    public ICollection<Product> Products { get; set; } = new List<Product>();
    public string? ImageUrl { get; set; }
    public int Position { get; set; }
}

public class Product : BaseEntity
{
    public string Name { get; set; } = default!;
    public string Slug { get; set; } = default!;
    public string? Description { get; set; }
    public decimal Price { get; set; }                 // base price (lowest variant)
    public string Currency { get; set; } = "ZAR";
    public ProductStatus Status { get; set; } = ProductStatus.Draft;
    public Guid CategoryId { get; set; }
    public Category Category { get; set; } = default!;
    public bool IsFeatured { get; set; }
    public DateTime? PublishedAt { get; set; }
    public double RatingAverage { get; set; }
    public int RatingCount { get; set; }

    public ICollection<ProductVariant> Variants { get; set; } = new List<ProductVariant>();
    public ICollection<ProductImage> Images { get; set; } = new List<ProductImage>();
    public ICollection<Review> Reviews { get; set; } = new List<Review>();
}

public class ProductVariant : BaseEntity
{
    public Guid ProductId { get; set; }
    public Product Product { get; set; } = default!;
    public string Sku { get; set; } = default!;
    public string? Size { get; set; }
    public string? Color { get; set; }
    public decimal Price { get; set; }
    public int StockOnHand { get; set; }
    public int StockReserved { get; set; }
    public int Available => StockOnHand - StockReserved;
}

public class ProductImage : BaseEntity
{
    public Guid ProductId { get; set; }
    public Product Product { get; set; } = default!;
    public string Url { get; set; } = default!;
    public string? ThumbnailUrl { get; set; }
    public int Position { get; set; }
    public string? Alt { get; set; }
}
