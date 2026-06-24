namespace DripSyndicate.Domain.Common;

/// <summary>Base type for all aggregate roots / entities. UUID PK + audit fields.</summary>
public abstract class BaseEntity
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? DeletedAt { get; set; }   // soft delete
    public bool IsDeleted => DeletedAt is not null;
}
