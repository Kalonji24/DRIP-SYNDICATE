using DripSyndicate.Application.Common.Interfaces;
using DripSyndicate.Application.DTOs;
using DripSyndicate.Domain.Entities;
using Microsoft.AspNetCore.Mvc;

namespace DripSyndicate.API.Controllers;

[ApiController]
[Route("api/v1/contact")]
public class ContactController : ControllerBase
{
    private readonly IApplicationDbContext _db;
    public ContactController(IApplicationDbContext db) => _db = db;

    [HttpPost]
    public async Task<IActionResult> Submit(ContactRequest req, CancellationToken ct)
    {
        _db.ContactMessages.Add(new ContactMessage
        {
            Name = req.Name, Email = req.Email, Subject = req.Subject, Message = req.Message
        });
        await _db.SaveChangesAsync(ct);
        return Ok(new { message = "Thanks — we'll be in touch." });
    }
}
