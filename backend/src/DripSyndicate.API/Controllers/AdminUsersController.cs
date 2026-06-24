using DripSyndicate.Application.Common.Interfaces;
using DripSyndicate.Domain.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace DripSyndicate.API.Controllers;

[ApiController]
[Authorize(Policy = "Admin")]
[Route("api/v1/admin/users")]
public class AdminUsersController : ControllerBase
{
    private readonly IApplicationDbContext _db;
    public AdminUsersController(IApplicationDbContext db) => _db = db;

    public record AssignRoleRequest(string Role);
    public record SetStatusRequest(string Status);

    [HttpGet]
    public async Task<IActionResult> List([FromQuery] string? q,
        [FromQuery] int page = 1, [FromQuery] int pageSize = 20, CancellationToken ct = default)
    {
        var query = _db.Users.AsNoTracking().AsQueryable();
        if (!string.IsNullOrWhiteSpace(q))
            query = query.Where(u => EF.Functions.ILike(u.Email, $"%{q}%") ||
                                     EF.Functions.ILike(u.FullName, $"%{q}%"));
        var total = await query.CountAsync(ct);
        var items = await query.OrderByDescending(u => u.CreatedAt)
            .Skip((page - 1) * pageSize).Take(pageSize)
            .Select(u => new { u.Id, u.Email, u.FullName, u.Status, u.CreatedAt,
                roles = u.UserRoles.Select(r => r.Role.Name) })
            .ToListAsync(ct);
        return Ok(new { items, total, page, pageSize });
    }

    [HttpPost("{id:guid}/roles")]
    public async Task<IActionResult> AssignRole(Guid id, AssignRoleRequest req, CancellationToken ct)
    {
        var role = await _db.Roles.FirstOrDefaultAsync(r => r.Name == req.Role, ct);
        if (role is null) return BadRequest(new { error = "Unknown role." });
        if (!await _db.UserRoles.AnyAsync(ur => ur.UserId == id && ur.RoleId == role.Id, ct))
        {
            _db.UserRoles.Add(new UserRole { UserId = id, RoleId = role.Id });
            await _db.SaveChangesAsync(ct);
        }
        return NoContent();
    }

    [HttpPatch("{id:guid}/status")]
    public async Task<IActionResult> SetStatus(Guid id, SetStatusRequest req, CancellationToken ct)
    {
        var u = await _db.Users.FirstOrDefaultAsync(x => x.Id == id, ct);
        if (u is null) return NotFound();
        u.Status = req.Status;   // active | locked | deactivated
        await _db.SaveChangesAsync(ct);
        return NoContent();
    }
}
