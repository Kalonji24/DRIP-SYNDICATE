using DripSyndicate.Application.Common.Interfaces;
using DripSyndicate.Application.DTOs;
using DripSyndicate.Domain.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace DripSyndicate.API.Controllers;

[ApiController]
[Authorize]
[Route("api/v1/cart")]
public class CartController : ControllerBase
{
    private readonly IApplicationDbContext _db;
    private readonly ICurrentUser _me;
    public CartController(IApplicationDbContext db, ICurrentUser me) { _db = db; _me = me; }

    [HttpGet]
    public async Task<ActionResult<CartDto>> Get(CancellationToken ct) => Ok(await BuildCart(ct));

    [HttpPost("items")]
    public async Task<ActionResult<CartDto>> Add(AddCartItemRequest req, CancellationToken ct)
    {
        var uid = _me.UserId!.Value;
        var variant = await _db.ProductVariants.FirstOrDefaultAsync(v => v.Id == req.ProductVariantId, ct);
        if (variant is null) return NotFound(new { error = "Variant not found." });
        if (variant.Available < req.Quantity) return Conflict(new { error = "Insufficient stock." });

        var existing = await _db.CartItems
            .FirstOrDefaultAsync(c => c.UserId == uid && c.ProductVariantId == req.ProductVariantId, ct);
        if (existing is null)
            _db.CartItems.Add(new CartItem { UserId = uid, ProductVariantId = req.ProductVariantId, Quantity = req.Quantity });
        else
            existing.Quantity = Math.Min(existing.Quantity + req.Quantity, 10);

        await _db.SaveChangesAsync(ct);
        return Ok(await BuildCart(ct));
    }

    [HttpPatch("items/{id:guid}")]
    public async Task<ActionResult<CartDto>> Update(Guid id, UpdateCartItemRequest req, CancellationToken ct)
    {
        var uid = _me.UserId!.Value;
        var item = await _db.CartItems.FirstOrDefaultAsync(c => c.Id == id && c.UserId == uid, ct);
        if (item is null) return NotFound();
        item.Quantity = Math.Clamp(req.Quantity, 1, 10);
        await _db.SaveChangesAsync(ct);
        return Ok(await BuildCart(ct));
    }

    [HttpDelete("items/{id:guid}")]
    public async Task<ActionResult<CartDto>> Remove(Guid id, CancellationToken ct)
    {
        var uid = _me.UserId!.Value;
        var item = await _db.CartItems.FirstOrDefaultAsync(c => c.Id == id && c.UserId == uid, ct);
        if (item is not null) { _db.CartItems.Remove(item); await _db.SaveChangesAsync(ct); }
        return Ok(await BuildCart(ct));
    }

    private async Task<CartDto> BuildCart(CancellationToken ct)
    {
        var uid = _me.UserId!.Value;
        var items = await _db.CartItems.AsNoTracking()
            .Where(c => c.UserId == uid)
            .Select(c => new CartItemDto(
                c.Id, c.ProductVariantId, c.ProductVariant.Product.Name,
                c.ProductVariant.Size, c.ProductVariant.Color, c.ProductVariant.Price,
                c.Quantity, c.ProductVariant.Price * c.Quantity,
                c.ProductVariant.Product.Images.OrderBy(i => i.Position).Select(i => i.Url).FirstOrDefault()))
            .ToListAsync(ct);
        return new CartDto(items, items.Sum(i => i.LineTotal), "ZAR");
    }
}
