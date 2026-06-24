using DripSyndicate.Domain.Enums;

namespace DripSyndicate.Application.DTOs;

public record CategoryDto(Guid Id, string Name, string Slug, string? Description, Guid? ParentId, string? ImageUrl, int Position);
public record UpsertCategoryRequest(string Name, string Slug, string? Description, Guid? ParentId, string? ImageUrl, int Position);

public record VariantDto(Guid Id, string Sku, string? Size, string? Color, decimal Price, int Available);
public record ProductImageDto(Guid Id, string Url, string? ThumbnailUrl, int Position, string? Alt);

public record ProductListItemDto(
    Guid Id, string Name, string Slug, decimal Price, string Currency,
    string? PrimaryImageUrl, double RatingAverage, int RatingCount, bool IsFeatured);

public record ProductDetailDto(
    Guid Id, string Name, string Slug, string? Description, decimal Price, string Currency,
    ProductStatus Status, Guid CategoryId, string CategoryName, bool IsFeatured,
    double RatingAverage, int RatingCount,
    IReadOnlyList<VariantDto> Variants, IReadOnlyList<ProductImageDto> Images);

public record UpsertProductRequest(
    string Name, string Slug, string? Description, decimal Price, string Currency,
    Guid CategoryId, ProductStatus Status, bool IsFeatured);

public record UpsertVariantRequest(string Sku, string? Size, string? Color, decimal Price, int StockOnHand);
public record AdjustStockRequest(int Delta, string? Reason);
