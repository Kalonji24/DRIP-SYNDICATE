using System.Security.Claims;
using DripSyndicate.Application.Common.Interfaces;

namespace DripSyndicate.API.Extensions;

public class CurrentUser : ICurrentUser
{
    private readonly IHttpContextAccessor _accessor;
    public CurrentUser(IHttpContextAccessor accessor) => _accessor = accessor;

    private ClaimsPrincipal? Principal => _accessor.HttpContext?.User;

    public Guid? UserId =>
        Guid.TryParse(Principal?.FindFirstValue(ClaimTypes.NameIdentifier)
            ?? Principal?.FindFirstValue("sub"), out var id) ? id : null;

    public string? Email => Principal?.FindFirstValue(ClaimTypes.Email)
        ?? Principal?.FindFirstValue("email");

    public bool IsAuthenticated => Principal?.Identity?.IsAuthenticated ?? false;
    public bool IsInRole(string role) => Principal?.IsInRole(role) ?? false;
}
