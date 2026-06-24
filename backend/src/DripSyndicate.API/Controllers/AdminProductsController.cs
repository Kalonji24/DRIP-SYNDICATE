using DripSyndicate.Application.Common.Interfaces;
using DripSyndicate.Application.DTOs;
using DripSyndicate.Domain.Entities;
using DripSyndicate.Domain.Enums;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace DripSyndicate.API.Controllers;

[ApiController]
[Authorize(Policy = "Staff")]
[Route("api/v1/admin/products")]
public class AdminProductsController : ControllerBase
{
    private readonly IApplicationDbContext _db;
    public AdminProductsController(IApplicationDbContext db) => _db = db;

    [HttpGet]
    public async Task<IActionResult> List([FromQuery] int page = 1, [FromQuery] int pageSize = 20, CancellationToken ct = default)
    {
        var q = _db.Products.AsNoTracking().OrderByDescending(p => p.CreatedAt);
        var total = await q.CountAsync(ct);
        var items = await q.Skip((page - 1) * pageSize).Take(pageSize)
            .Select(p => new { p.Id, p.Name, p.Slug, p.Price, p.Status, p.IsFeatured, p.CategoryId }).ToListAsync(ct);
        return Ok(new { items, total, page, pageSize });
    }

    [HttpPost]
    public async Task<IActionResult> Create(UpsertProductRequest req, CancellationToken ct)
    {
        if (await _db.Products.AnyAsync(p => p.Slug == req.Slug, ct))
            return Conflict(new { error = "Slug already exists." });
        var p = new Product
        {
            Name = req.Name, Slug = req.Slug, Description = req.Description, Price = req.Price,
            Currency = req.Currency, CategoryId = req.CategoryId, Status = req.Status, IsFeatured = req.IsFeatured,
            PublishedAt = req.Status == ProductStatus.Active ? DateTime.UtcNow : null
        };
        _db.Products.Add(p);
        await _db.SaveChangesAsync(ct);
        return CreatedAtAction(nameof(Get), new { id = p.Id }, new { p.Id });
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> Get(Guid id, CancellationToken ct)
    {
        var p = await _db.Products.AsNoTracking().Include(x => x.Variants).Include(x => x.Images)
            .FirstOrDefaultAsync(x => x.Id == id, ct);
        return p is null ? NotFound() : Ok(p);
    }

    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Update(Guid id, UpsertProductRequest req, CancellationToken ct)
    {
        var p = await _db.Products.FirstOrDefaultAsync(x => x.Id == id, ct);
        if (p is null) return NotFound();
        p.Name = req.Name; p.Slug = req.Slug; p.Description = req.Description; p.Price = req.Price;
        p.Currency = req.Currency; p.CategoryId = req.CategoryId; p.Status = req.Status; p.IsFeatured = req.IsFeatured;
        if (req.Status == ProductStatus.Active && p.PublishedAt is null) p.PublishedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync(ct);
        return NoContent();
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id, CancellationToken ct)
    {
        var p = await _db.Products.FirstOrDefaultAsync(x => x.Id == id, ct);
        if (p is null) return NotFound();
        p.DeletedAt = DateTime.UtcNow;   // soft delete
        await _db.SaveChangesAsync(ct);
        return NoContent();
    }

    [HttpPost("{id:guid}/variants")]
    public async Task<IActionResult> AddVariant(Guid id, UpsertVariantRequest req, CancellationToken ct)
    {
        if (!await _db.Products.AnyAsync(p => p.Id == id, ct)) return NotFound();
        var v = new ProductVariant { ProductId = id, Sku = req.Sku, Size = req.Size,
            Color = req.Color, Price = req.Price, StockOnHand = req.StockOnHand };
        _db.ProductVariants.Add(v);
        await _db.SaveChangesAsync(ct);
        return Ok(new { v.Id });
    }

    [HttpPost("variants/{variantId:guid}/stock")]
    public async Task<IActionResult> AdjustStock(Guid variantId, AdjustStockRequest req, CancellationToken ct)
    {
        var v = await _db.ProductVariants.FirstOrDefaultAsync(x => x.Id == variantId, ct);
        if (v is null) return NotFound();
        if (v.StockOnHand + req.Delta < 0) return BadRequest(new { error = "Stock cannot go negative." });
        v.StockOnHand += req.Delta;
        await _db.SaveChangesAsync(ct);
        return Ok(new { v.Id, v.StockOnHand, v.Available });
    }
}
