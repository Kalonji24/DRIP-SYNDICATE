using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using DripSyndicate.Application.Common.Models;
using DripSyndicate.Domain.Entities;
using DripSyndicate.Infrastructure.Identity;
using FluentAssertions;
using Microsoft.Extensions.Options;
using Xunit;

namespace DripSyndicate.Tests;

public class JwtTokenServiceTests
{
    private static JwtTokenService CreateSut() => new(Options.Create(new JwtSettings
    {
        Issuer = "drip-syndicate",
        Audience = "drip-syndicate-clients",
        Secret = "test-secret-key-that-is-definitely-32-bytes-long!!",
        AccessTokenMinutes = 15,
        RefreshTokenDays = 30
    }));

    [Fact]
    public void CreateAccessToken_EmbedsSubEmailAndRoleClaims()
    {
        var sut = CreateSut();
        var user = new User { Id = Guid.NewGuid(), Email = "neo@drip.io", FullName = "Neo" };

        var jwt = sut.CreateAccessToken(user, new[] { "admin", "customer" });
        var token = new JwtSecurityTokenHandler().ReadJwtToken(jwt);

        token.Subject.Should().Be(user.Id.ToString());
        token.Claims.Should().Contain(c => c.Type == JwtRegisteredClaimNames.Email && c.Value == "neo@drip.io");
        token.Claims.Where(c => c.Type == ClaimTypes.Role).Select(c => c.Value)
            .Should().BeEquivalentTo("admin", "customer");
    }

    [Fact]
    public void CreateRefreshToken_ReturnsRawWithMatchingHash()
    {
        var sut = CreateSut();
        var (raw, hash) = sut.CreateRefreshToken();

        raw.Should().NotBeNullOrWhiteSpace();
        hash.Should().Be(sut.Hash(raw));          // hash is deterministic SHA-256 of raw
        sut.Hash("different").Should().NotBe(hash);
    }
}
