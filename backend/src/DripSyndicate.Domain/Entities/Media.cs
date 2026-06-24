using DripSyndicate.Domain.Common;
using DripSyndicate.Domain.Enums;

namespace DripSyndicate.Domain.Entities;

/// <summary>Any asset stored in Supabase Storage (image, video, thumbnail).</summary>
public class MediaAsset : BaseEntity
{
    public string Bucket { get; set; } = "media";
    public string Path { get; set; } = default!;        // object key in Supabase
    public string Url { get; set; } = default!;         // public/signed URL
    public string? ThumbnailUrl { get; set; }
    public MediaType Type { get; set; } = MediaType.Image;
    public MediaScope Scope { get; set; } = MediaScope.Other;
    public long SizeBytes { get; set; }
    public int? Width { get; set; }
    public int? Height { get; set; }
    public string? ContentType { get; set; }
    public string? Alt { get; set; }
    public Guid? OwnerEntityId { get; set; }            // e.g. ProductId
}

public class Banner : BaseEntity
{
    public string Title { get; set; } = default!;
    public string? Subtitle { get; set; }
    public string ImageUrl { get; set; } = default!;
    public string? LinkUrl { get; set; }
    public int Position { get; set; }
    public bool IsActive { get; set; } = true;
    public DateTime? StartsAt { get; set; }
    public DateTime? EndsAt { get; set; }
}

public class PromoVideo : BaseEntity
{
    public string Title { get; set; } = default!;
    public string VideoUrl { get; set; } = default!;
    public string? PosterUrl { get; set; }
    public bool IsActive { get; set; } = true;
    public int Position { get; set; }
}
