using DripSyndicate.Application.Common.Interfaces;
using DripSyndicate.Application.Common.Models;
using DripSyndicate.Application.DTOs;
using DripSyndicate.Domain.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;
using System.Security.Cryptography;

namespace DripSyndicate.API.Controllers;

[ApiController]
[Route("api/v1/auth")]
[EnableRateLimiting("auth")]
public class AuthController : ControllerBase
{
    private readonly IApplicationDbContext _db;
    private readonly IPasswordHasher _hasher;
    private readonly IJwtTokenService _jwt;
    private readonly JwtSettings _settings;

    public AuthController(IApplicationDbContext db, IPasswordHasher hasher, IJwtTokenService jwt,
        Microsoft.Extensions.Options.IOptions<JwtSettings> opt)
    { _db = db; _hasher = hasher; _jwt = jwt; _settings = opt.Value; }

    [HttpPost("register")]
    public async Task<IActionResult> Register(RegisterRequest req, CancellationToken ct)
    {
        var email = req.Email.Trim().ToLowerInvariant();
        if (await _db.Users.AnyAsync(u => u.Email == email, ct))
            return Conflict(new { error = "Email already registered." });

        var user = new User
        {
            Email = email, FullName = req.FullName.Trim(), Phone = req.Phone,
            PasswordHash = _hasher.Hash(req.Password)
        };
        _db.Users.Add(user);
        await _db.SaveChangesAsync(ct);

        var customer = await _db.Roles.FirstAsync(r => r.Name == "customer", ct);
        _db.UserRoles.Add(new UserRole { UserId = user.Id, RoleId = customer.Id });
        await _db.SaveChangesAsync(ct);

        return Ok(await IssueTokens(user, ct));
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login(LoginRequest req, CancellationToken ct)
    {
        var email = req.Email.Trim().ToLowerInvariant();
        var user = await _db.Users.Include(u => u.UserRoles).ThenInclude(ur => ur.Role)
            .FirstOrDefaultAsync(u => u.Email == email, ct);

        if (user is null || user.PasswordHash is null || !_hasher.Verify(req.Password, user.PasswordHash))
            return Unauthorized(new { error = "Invalid credentials." });
        if (user.Status != "active")
            return Unauthorized(new { error = "Account is not active." });

        return Ok(await IssueTokens(user, ct));
    }

    [HttpPost("refresh")]
    public async Task<IActionResult> Refresh(RefreshRequest req, CancellationToken ct)
    {
        var hash = _jwt.Hash(req.RefreshToken);
        var token = await _db.RefreshTokens.Include(t => t.User).ThenInclude(u => u.UserRoles)
            .ThenInclude(ur => ur.Role)
            .FirstOrDefaultAsync(t => t.TokenHash == hash, ct);

        if (token is null || !token.IsActive)
            return Unauthorized(new { error = "Invalid or expired refresh token." });

        // rotate
        token.RevokedAt = DateTime.UtcNow;
        var result = await IssueTokens(token.User, ct);
        return Ok(result);
    }

    [Authorize]
    [HttpPost("logout")]
    public async Task<IActionResult> Logout(RefreshRequest req, CancellationToken ct)
    {
        var hash = _jwt.Hash(req.RefreshToken);
        var token = await _db.RefreshTokens.FirstOrDefaultAsync(t => t.TokenHash == hash, ct);
        if (token is not null) { token.RevokedAt = DateTime.UtcNow; await _db.SaveChangesAsync(ct); }
        return NoContent();
    }

    [HttpPost("forgot-password")]
    public async Task<IActionResult> Forgot(ForgotPasswordRequest req, CancellationToken ct)
    {
        var email = req.Email.Trim().ToLowerInvariant();
        var user = await _db.Users.FirstOrDefaultAsync(u => u.Email == email, ct);
        if (user is not null)
        {
            var raw = Convert.ToHexString(RandomNumberGenerator.GetBytes(32));
            user.PasswordResetTokenHash = _jwt.Hash(raw);
            user.PasswordResetExpiresAt = DateTime.UtcNow.AddMinutes(30);
            await _db.SaveChangesAsync(ct);
            // TODO: email `raw` link to user. Returned here only in dev.
            return Ok(new { message = "If the account exists, a reset link has been sent.", devToken = raw });
        }
        return Ok(new { message = "If the account exists, a reset link has been sent." });
    }

    [HttpPost("reset-password")]
    public async Task<IActionResult> Reset(ResetPasswordRequest req, CancellationToken ct)
    {
        var email = req.Email.Trim().ToLowerInvariant();
        var hash = _jwt.Hash(req.Token);
        var user = await _db.Users.FirstOrDefaultAsync(u =>
            u.Email == email && u.PasswordResetTokenHash == hash, ct);

        if (user is null || user.PasswordResetExpiresAt < DateTime.UtcNow)
            return BadRequest(new { error = "Invalid or expired reset token." });

        user.PasswordHash = _hasher.Hash(req.NewPassword);
        user.PasswordResetTokenHash = null;
        user.PasswordResetExpiresAt = null;
        await _db.SaveChangesAsync(ct);
        return Ok(new { message = "Password updated." });
    }

    [Authorize]
    [HttpGet("me")]
    public async Task<IActionResult> Me(CancellationToken ct)
    {
        var email = User.Identity?.Name ?? User.FindFirst("email")?.Value;
        var user = await _db.Users.Include(u => u.UserRoles).ThenInclude(ur => ur.Role)
            .FirstOrDefaultAsync(u => u.Email == email, ct);
        if (user is null) return NotFound();
        return Ok(new { user.Id, user.Email, user.FullName,
            roles = user.UserRoles.Select(r => r.Role.Name) });
    }

    private async Task<AuthResponse> IssueTokens(User user, CancellationToken ct)
    {
        var roles = user.UserRoles.Select(ur => ur.Role.Name).ToArray();
        if (roles.Length == 0)
            roles = await _db.UserRoles.Where(ur => ur.UserId == user.Id)
                .Select(ur => ur.Role.Name).ToArrayAsync(ct);

        var access = _jwt.CreateAccessToken(user, roles);
        var (raw, hash) = _jwt.CreateRefreshToken();
        _db.RefreshTokens.Add(new RefreshToken
        {
            UserId = user.Id, TokenHash = hash,
            ExpiresAt = DateTime.UtcNow.AddDays(_settings.RefreshTokenDays)
        });
        await _db.SaveChangesAsync(ct);

        return new AuthResponse(user.Id, user.Email, user.FullName, roles, access, raw,
            _settings.AccessTokenMinutes * 60);
    }
}
