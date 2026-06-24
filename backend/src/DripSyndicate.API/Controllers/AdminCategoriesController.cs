using DripSyndicate.Application.Common.Interfaces;
using DripSyndicate.Application.DTOs;
using DripSyndicate.Domain.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace DripSyndicate.API.Controllers;

[ApiController]
[Authorize(Policy = "Staff")]
[Route("api/v1/admin/categories")]
public class AdminCategoriesController : ControllerBase
{
    private readonly IApplicationDbContext _db;
    public AdminCategoriesController(IApplicationDbContext db) => _db = db;

    [HttpPost]
    public async Task<IActionResult> Create(UpsertCategoryRequest req, CancellationToken ct)
    {
        if (await _db.Categories.AnyAsync(c => c.Slug == req.Slug, ct))
            return Conflict(new { error = "Slug already exists." });
        var c = new Category { Name = req.Name, Slug = req.Slug, Description = req.Description,
            ParentId = req.ParentId, ImageUrl = req.ImageUrl, Position = req.Position };
        _db.Categories.Add(c);
        await _db.SaveChangesAsync(ct);
        return Ok(new { c.Id });
    }

    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Update(Guid id, UpsertCategoryRequest req, CancellationToken ct)
    {
        var c = await _db.Categories.FirstOrDefaultAsync(x => x.Id == id, ct);
        if (c is null) return NotFound();
        c.Name = req.Name; c.Slug = req.Slug; c.Description = req.Description;
        c.ParentId = req.ParentId; c.ImageUrl = req.ImageUrl; c.Position = req.Position;
        await _db.SaveChangesAsync(ct);
        return NoContent();
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id, CancellationToken ct)
    {
        var c = await _db.Categories.FirstOrDefaultAsync(x => x.Id == id, ct);
        if (c is null) return NotFound();
        if (await _db.Products.AnyAsync(p => p.CategoryId == id, ct))
            return Conflict(new { error = "Category has products; reassign them first." });
        c.DeletedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync(ct);
        return NoContent();
    }
}
