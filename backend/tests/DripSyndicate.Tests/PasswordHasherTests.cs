using DripSyndicate.Infrastructure.Identity;
using FluentAssertions;
using Xunit;

namespace DripSyndicate.Tests;

public class PasswordHasherTests
{
    private readonly PasswordHasher _sut = new();

    [Fact]
    public void Hash_ThenVerify_ReturnsTrue_ForCorrectPassword()
    {
        var hash = _sut.Hash("Sup3r$ecret!");
        _sut.Verify("Sup3r$ecret!", hash).Should().BeTrue();
    }

    [Fact]
    public void Verify_ReturnsFalse_ForWrongPassword()
    {
        var hash = _sut.Hash("Sup3r$ecret!");
        _sut.Verify("wrong-password", hash).Should().BeFalse();
    }

    [Fact]
    public void Hash_ProducesDifferentHashes_ForSameInput_DueToSalt()
    {
        _sut.Hash("same").Should().NotBe(_sut.Hash("same"));
    }
}
