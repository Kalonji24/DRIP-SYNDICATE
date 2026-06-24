using DripSyndicate.Application.Common.Interfaces;
using DripSyndicate.Application.Common.Models;
using DripSyndicate.Application.DTOs;
using DripSyndicate.Domain.Enums;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace DripSyndicate.API.Controllers;

[ApiController]
[Route("api/v1/products")]
public class ProductsController : ControllerBase
{
    private readonly IApplicationDbContext _db;
    public ProductsController(IApplicationDbContext db) => _db = db;

    /// <summary>Paginated, filterable product list (storefront).</summary>
    [HttpGet]
    public async Task<ActionResult<PagedResult<ProductListItemDto>>> List(
        [FromQuery] string? category, [FromQuery] bool? featured,
        [FromQuery] string sort = "newest",
        [FromQuery] int page = 1, [FromQuery] int pageSize = 12, CancellationToken ct = default)
    {
        pageSize = Math.Clamp(pageSize, 1, 60); page = Math.Max(page, 1);

        var q = _db.Products.AsNoTracking().Where(p => p.Status == ProductStatus.Active);
        if (!string.IsNullOrWhiteSpace(category))
            q = q.Where(p => p.Category.Slug == category);
        if (featured is bool f) q = q.Where(p => p.IsFeatured == f);

        q = sort switch
        {
            "price-asc" => q.OrderBy(p => p.Price),
            "price-desc" => q.OrderByDescending(p => p.Price),
            "rating" => q.OrderByDescending(p => p.RatingAverage),
            _ => q.OrderByDescending(p => p.PublishedAt)
        };

        var total = await q.CountAsync(ct);
        var items = await q.Skip((page - 1) * pageSize).Take(pageSize)
            .Select(p => new ProductListItemDto(
                p.Id, p.Name, p.Slug, p.Price, p.Currency,
                p.Images.OrderBy(i => i.Position).Select(i => i.Url).FirstOrDefault(),
                p.RatingAverage, p.RatingCount, p.IsFeatured))
            .ToListAsync(ct);

        return Ok(new PagedResult<ProductListItemDto>
        { Items = items, Page = page, PageSize = pageSize, TotalCount = total });
    }

    /// <summary>Product detail by slug, including variants and images.</summary>
    [HttpGet("{slug}")]
    public async Task<ActionResult<ProductDetailDto>> GetBySlug(string slug, CancellationToken ct)
    {
        var p = await _db.Products.AsNoTracking()
            .Include(x => x.Category)
            .Include(x => x.Variants)
            .Include(x => x.Images)
            .FirstOrDefaultAsync(x => x.Slug == slug && x.Status == ProductStatus.Active, ct);
        if (p is null) return NotFound();

        return Ok(new ProductDetailDto(
            p.Id, p.Name, p.Slug, p.Description, p.Price, p.Currency, p.Status,
            p.CategoryId, p.Category.Name, p.IsFeatured, p.RatingAverage, p.RatingCount,
            p.Variants.Select(v => new VariantDto(v.Id, v.Sku, v.Size, v.Color, v.Price, v.Available)).ToList(),
            p.Images.OrderBy(i => i.Position)
                .Select(i => new ProductImageDto(i.Id, i.Url, i.ThumbnailUrl, i.Position, i.Alt)).ToList()));
    }

    /// <summary>Approved reviews for a product.</summary>
    [HttpGet("{id:guid}/reviews")]
    public async Task<ActionResult<IEnumerable<ReviewDto>>> Reviews(Guid id, CancellationToken ct)
    {
        var reviews = await _db.Reviews.AsNoTracking()
            .Where(r => r.ProductId == id && r.IsApproved)
            .OrderByDescending(r => r.CreatedAt)
            .Select(r => new ReviewDto(r.Id, r.Rating, r.Title, r.Body,
                r.User.FullName, r.VerifiedPurchase, r.CreatedAt))
            .ToListAsync(ct);
        return Ok(reviews);
    }
}
