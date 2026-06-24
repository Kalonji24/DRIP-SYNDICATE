using DripSyndicate.Application.Common.Interfaces;
using DripSyndicate.Application.DTOs;
using DripSyndicate.Domain.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace DripSyndicate.API.Controllers;

[ApiController]
[Authorize]
[Route("api/v1/wishlist")]
public class WishlistController : ControllerBase
{
    private readonly IApplicationDbContext _db;
    private readonly ICurrentUser _me;
    public WishlistController(IApplicationDbContext db, ICurrentUser me) { _db = db; _me = me; }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<WishlistItemDto>>> Get(CancellationToken ct)
    {
        var uid = _me.UserId!.Value;
        var items = await _db.WishlistItems.AsNoTracking().Where(w => w.UserId == uid)
            .Select(w => new WishlistItemDto(w.Id, w.ProductId, w.Product.Name, w.Product.Slug,
                w.Product.Price, w.Product.Images.OrderBy(i => i.Position).Select(i => i.Url).FirstOrDefault()))
            .ToListAsync(ct);
        return Ok(items);
    }

    [HttpPost("items")]
    public async Task<IActionResult> Add(AddWishlistRequest req, CancellationToken ct)
    {
        var uid = _me.UserId!.Value;
        if (!await _db.WishlistItems.AnyAsync(w => w.UserId == uid && w.ProductId == req.ProductId, ct))
        {
            _db.WishlistItems.Add(new WishlistItem { UserId = uid, ProductId = req.ProductId });
            await _db.SaveChangesAsync(ct);
        }
        return NoContent();
    }

    [HttpDelete("items/{id:guid}")]
    public async Task<IActionResult> Remove(Guid id, CancellationToken ct)
    {
        var uid = _me.UserId!.Value;
        var item = await _db.WishlistItems.FirstOrDefaultAsync(w => w.Id == id && w.UserId == uid, ct);
        if (item is not null) { _db.WishlistItems.Remove(item); await _db.SaveChangesAsync(ct); }
        return NoContent();
    }
}
