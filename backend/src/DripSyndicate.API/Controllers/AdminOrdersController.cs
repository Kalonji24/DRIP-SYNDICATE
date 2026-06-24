using DripSyndicate.Application.Common.Interfaces;
using DripSyndicate.Domain.Enums;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace DripSyndicate.API.Controllers;

[ApiController]
[Authorize(Policy = "Staff")]
[Route("api/v1/admin/orders")]
public class AdminOrdersController : ControllerBase
{
    private readonly IApplicationDbContext _db;
    public AdminOrdersController(IApplicationDbContext db) => _db = db;

    public record UpdateStatusRequest(OrderStatus Status);

    [HttpGet]
    public async Task<IActionResult> List([FromQuery] OrderStatus? status,
        [FromQuery] int page = 1, [FromQuery] int pageSize = 20, CancellationToken ct = default)
    {
        var q = _db.Orders.AsNoTracking().AsQueryable();
        if (status is OrderStatus s) q = q.Where(o => o.Status == s);
        var total = await q.CountAsync(ct);
        var items = await q.OrderByDescending(o => o.CreatedAt)
            .Skip((page - 1) * pageSize).Take(pageSize)
            .Select(o => new { o.Id, o.Number, o.Status, o.Total, o.Currency, o.Email, o.CreatedAt })
            .ToListAsync(ct);
        return Ok(new { items, total, page, pageSize });
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> Get(Guid id, CancellationToken ct)
    {
        var o = await _db.Orders.AsNoTracking().Include(x => x.Items).Include(x => x.Payment)
            .FirstOrDefaultAsync(x => x.Id == id, ct);
        return o is null ? NotFound() : Ok(o);
    }

    [HttpPatch("{id:guid}/status")]
    public async Task<IActionResult> UpdateStatus(Guid id, UpdateStatusRequest req, CancellationToken ct)
    {
        var o = await _db.Orders.FirstOrDefaultAsync(x => x.Id == id, ct);
        if (o is null) return NotFound();
        o.Status = req.Status;
        await _db.SaveChangesAsync(ct);
        return Ok(new { o.Id, o.Status });
    }
}
