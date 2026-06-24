using DripSyndicate.Application.Common.Interfaces;
using DripSyndicate.Domain.Enums;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace DripSyndicate.API.Controllers;

[ApiController]
[Authorize(Policy = "Staff")]
[Route("api/v1/admin/analytics")]
public class AdminAnalyticsController : ControllerBase
{
    private readonly IApplicationDbContext _db;
    public AdminAnalyticsController(IApplicationDbContext db) => _db = db;

    [HttpGet("summary")]
    public async Task<IActionResult> Summary(CancellationToken ct)
    {
        var paid = _db.Orders.Where(o => o.Status != OrderStatus.Created && o.Status != OrderStatus.Cancelled);
        var revenue = await paid.SumAsync(o => (decimal?)o.Total, ct) ?? 0m;
        var orderCount = await paid.CountAsync(ct);
        var aov = orderCount > 0 ? revenue / orderCount : 0m;

        var since = DateTime.UtcNow.AddDays(-30);
        var revenueByDay = await paid.Where(o => o.CreatedAt >= since)
            .GroupBy(o => o.CreatedAt.Date)
            .Select(g => new { date = g.Key, revenue = g.Sum(x => x.Total), orders = g.Count() })
            .OrderBy(x => x.date).ToListAsync(ct);

        var topProducts = await _db.OrderItems.AsNoTracking()
            .GroupBy(i => i.NameSnapshot)
            .Select(g => new { product = g.Key, units = g.Sum(x => x.Quantity), revenue = g.Sum(x => x.LineTotal) })
            .OrderByDescending(x => x.revenue).Take(5).ToListAsync(ct);

        return Ok(new
        {
            revenue, orderCount, averageOrderValue = Math.Round(aov, 2),
            customers = await _db.Users.CountAsync(ct),
            products = await _db.Products.CountAsync(ct),
            lowStock = await _db.ProductVariants.CountAsync(v => v.StockOnHand - v.StockReserved < 10, ct),
            revenueByDay, topProducts
        });
    }
}
