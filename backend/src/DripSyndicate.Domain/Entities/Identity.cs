using DripSyndicate.Domain.Common;

namespace DripSyndicate.Domain.Entities;

public class User : BaseEntity
{
    public string Email { get; set; } = default!;
    public string? PasswordHash { get; set; }          // null for social-only
    public string FullName { get; set; } = default!;
    public string? Phone { get; set; }
    public bool EmailVerified { get; set; }
    public string Status { get; set; } = "active";      // active | locked | deactivated

    // password reset
    public string? PasswordResetTokenHash { get; set; }
    public DateTime? PasswordResetExpiresAt { get; set; }

    public ICollection<UserRole> UserRoles { get; set; } = new List<UserRole>();
    public ICollection<RefreshToken> RefreshTokens { get; set; } = new List<RefreshToken>();
    public ICollection<Order> Orders { get; set; } = new List<Order>();
    public ICollection<Review> Reviews { get; set; } = new List<Review>();
    public ICollection<WishlistItem> WishlistItems { get; set; } = new List<WishlistItem>();
    public ICollection<CartItem> CartItems { get; set; } = new List<CartItem>();
}

public class Role : BaseEntity
{
    public string Name { get; set; } = default!;        // customer | admin | support | catalog
    public string? Description { get; set; }
    public ICollection<UserRole> UserRoles { get; set; } = new List<UserRole>();
}

public class UserRole
{
    public Guid UserId { get; set; }
    public User User { get; set; } = default!;
    public Guid RoleId { get; set; }
    public Role Role { get; set; } = default!;
}

public class RefreshToken : BaseEntity
{
    public Guid UserId { get; set; }
    public User User { get; set; } = default!;
    public string TokenHash { get; set; } = default!;   // store hash, never raw
    public DateTime ExpiresAt { get; set; }
    public DateTime? RevokedAt { get; set; }
    public string? ReplacedByTokenHash { get; set; }
    public bool IsActive => RevokedAt is null && DateTime.UtcNow < ExpiresAt;
}
