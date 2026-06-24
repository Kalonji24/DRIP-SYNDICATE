using DripSyndicate.Application.Common.Interfaces;
using DripSyndicate.Application.DTOs;
using DripSyndicate.Domain.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace DripSyndicate.API.Controllers;

[ApiController]
[Route("api/v1/products/{productId:guid}/reviews")]
public class ReviewsController : ControllerBase
{
    private readonly IApplicationDbContext _db;
    private readonly ICurrentUser _me;
    public ReviewsController(IApplicationDbContext db, ICurrentUser me) { _db = db; _me = me; }

    [Authorize]
    [HttpPost]
    public async Task<IActionResult> Create(Guid productId, CreateReviewRequest req, CancellationToken ct)
    {
        var uid = _me.UserId!.Value;
        if (!await _db.Products.AnyAsync(p => p.Id == productId, ct)) return NotFound();
        if (await _db.Reviews.AnyAsync(r => r.ProductId == productId && r.UserId == uid, ct))
            return Conflict(new { error = "You already reviewed this product." });

        var verified = await _db.OrderItems.AnyAsync(oi =>
            oi.Order.UserId == uid &&
            _db.ProductVariants.Any(v => v.Id == oi.ProductVariantId && v.ProductId == productId), ct);

        _db.Reviews.Add(new Review
        {
            ProductId = productId, UserId = uid, Rating = req.Rating,
            Title = req.Title, Body = req.Body, VerifiedPurchase = verified, IsApproved = false
        });
        await _db.SaveChangesAsync(ct);
        return Accepted(new { message = "Review submitted for moderation." });
    }
}
