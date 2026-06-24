using DripSyndicate.Application.Common.Interfaces;

namespace DripSyndicate.Infrastructure.Identity;

/// <summary>BCrypt-based hasher (work factor 12). Swap for Argon2id in production if desired.</summary>
public class PasswordHasher : IPasswordHasher
{
    public string Hash(string password) => BCrypt.Net.BCrypt.HashPassword(password, workFactor: 12);
    public bool Verify(string password, string hash) => BCrypt.Net.BCrypt.Verify(password, hash);
}
