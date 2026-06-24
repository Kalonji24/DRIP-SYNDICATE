using DripSyndicate.Domain.Entities;

namespace DripSyndicate.Application.Common.Interfaces;

public interface IJwtTokenService
{
    string CreateAccessToken(User user, IEnumerable<string> roles);
    (string raw, string hash) CreateRefreshToken();
    string Hash(string raw);
}

public interface IPasswordHasher
{
    string Hash(string password);
    bool Verify(string password, string hash);
}

public interface ICurrentUser
{
    Guid? UserId { get; }
    string? Email { get; }
    bool IsAuthenticated { get; }
    bool IsInRole(string role);
}

public interface IDateTime { DateTime UtcNow { get; } }

/// <summary>Result of an upload to Supabase Storage.</summary>
public record StoredMedia(string Path, string Url, string? ThumbnailUrl, long SizeBytes,
    int? Width, int? Height, string ContentType);

public interface IMediaStorage
{
    Task<StoredMedia> UploadImageAsync(Stream content, string fileName, string contentType,
        bool generateThumbnail = true, int? resizeWidth = null, CancellationToken ct = default);
    Task<StoredMedia> UploadVideoAsync(Stream content, string fileName, string contentType,
        CancellationToken ct = default);
    Task DeleteAsync(string path, CancellationToken ct = default);
    Task<StoredMedia> ReplaceImageAsync(string existingPath, Stream content, string fileName,
        string contentType, CancellationToken ct = default);
}

/// <summary>Image processing (crop/resize/thumbnail) before upload.</summary>
public interface IImageProcessor
{
    Task<(Stream stream, int width, int height)> ResizeAsync(Stream input, int width, int? height = null);
    Task<(Stream stream, int width, int height)> CropAsync(Stream input, int x, int y, int width, int height);
    Task<Stream> ThumbnailAsync(Stream input, int size = 320);
}
