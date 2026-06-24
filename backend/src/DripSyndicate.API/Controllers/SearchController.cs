using DripSyndicate.Application.Common.Interfaces;
using DripSyndicate.Application.DTOs;
using DripSyndicate.Domain.Enums;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace DripSyndicate.API.Controllers;

[ApiController]
[Route("api/v1/search")]
public class SearchController : ControllerBase
{
    private readonly IApplicationDbContext _db;
    public SearchController(IApplicationDbContext db) => _db = db;

    /// <summary>Simple ILIKE search (swap for OpenSearch later). Parameterised — injection-safe.</summary>
    [HttpGet]
    public async Task<ActionResult<IEnumerable<ProductListItemDto>>> Search(
        [FromQuery] string q, [FromQuery] int limit = 20, CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(q) || q.Length > 128) return Ok(Array.Empty<ProductListItemDto>());
        limit = Math.Clamp(limit, 1, 60);
        var pattern = $"%{q.Trim()}%";

        var items = await _db.Products.AsNoTracking()
            .Where(p => p.Status == ProductStatus.Active &&
                        (EF.Functions.ILike(p.Name, pattern) || EF.Functions.ILike(p.Description!, pattern)))
            .Take(limit)
            .Select(p => new ProductListItemDto(p.Id, p.Name, p.Slug, p.Price, p.Currency,
                p.Images.OrderBy(i => i.Position).Select(i => i.Url).FirstOrDefault(),
                p.RatingAverage, p.RatingCount, p.IsFeatured))
            .ToListAsync(ct);
        return Ok(items);
    }
}
