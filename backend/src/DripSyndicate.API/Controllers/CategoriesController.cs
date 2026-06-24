using DripSyndicate.Application.Common.Interfaces;
using DripSyndicate.Application.DTOs;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace DripSyndicate.API.Controllers;

[ApiController]
[Route("api/v1/categories")]
public class CategoriesController : ControllerBase
{
    private readonly IApplicationDbContext _db;
    public CategoriesController(IApplicationDbContext db) => _db = db;

    [HttpGet]
    public async Task<ActionResult<IEnumerable<CategoryDto>>> List(CancellationToken ct)
    {
        var cats = await _db.Categories.AsNoTracking().OrderBy(c => c.Position)
            .Select(c => new CategoryDto(c.Id, c.Name, c.Slug, c.Description, c.ParentId, c.ImageUrl, c.Position))
            .ToListAsync(ct);
        return Ok(cats);
    }
}
