using DripSyndicate.Application.Common.Interfaces;
using Microsoft.Extensions.Configuration;

namespace DripSyndicate.Infrastructure.Storage;

/// <summary>
/// Talks to Supabase Storage via its S3-compatible REST endpoints using a plain HttpClient.
/// Config keys: Supabase:Url, Supabase:ServiceKey, Supabase:Bucket.
/// </summary>
public class SupabaseStorageService : IMediaStorage
{
    private readonly HttpClient _http;
    private readonly IImageProcessor _images;
    private readonly string _url;
    private readonly string _bucket;
    private readonly string _serviceKey;

    public SupabaseStorageService(HttpClient http, IImageProcessor images, IConfiguration cfg)
    {
        _http = http;
        _images = images;
        _url = cfg["Supabase:Url"]?.TrimEnd('/') ?? "";
        _bucket = cfg["Supabase:Bucket"] ?? "media";
        _serviceKey = cfg["Supabase:ServiceKey"] ?? "";
    }

    public async Task<StoredMedia> UploadImageAsync(Stream content, string fileName, string contentType,
        bool generateThumbnail = true, int? resizeWidth = null, CancellationToken ct = default)
    {
        // Optionally resize the master image first.
        Stream master = content;
        int? w = null, h = null;
        if (resizeWidth is int rw)
        {
            var (rs, rWidth, rHeight) = await _images.ResizeAsync(content, rw);
            master = rs; w = rWidth; h = rHeight; contentType = "image/webp";
            fileName = Path.ChangeExtension(fileName, ".webp");
        }

        var key = BuildKey(fileName);
        var url = await PutAsync(key, master, contentType, ct);

        string? thumbUrl = null;
        if (generateThumbnail)
        {
            master.Position = 0;
            await using var thumb = await _images.ThumbnailAsync(master);
            var thumbKey = BuildKey("thumb_" + Path.GetFileNameWithoutExtension(fileName) + ".webp");
            thumbUrl = await PutAsync(thumbKey, thumb, "image/webp", ct);
        }

        var size = master.CanSeek ? master.Length : 0;
        return new StoredMedia(key, url, thumbUrl, size, w, h, contentType);
    }

    public async Task<StoredMedia> UploadVideoAsync(Stream content, string fileName, string contentType,
        CancellationToken ct = default)
    {
        var key = BuildKey(fileName);
        var url = await PutAsync(key, content, contentType, ct);
        var size = content.CanSeek ? content.Length : 0;
        return new StoredMedia(key, url, null, size, null, null, contentType);
    }

    public async Task<StoredMedia> ReplaceImageAsync(string existingPath, Stream content, string fileName,
        string contentType, CancellationToken ct = default)
    {
        await DeleteAsync(existingPath, ct);
        return await UploadImageAsync(content, fileName, contentType, ct: ct);
    }

    public async Task DeleteAsync(string path, CancellationToken ct = default)
    {
        var req = new HttpRequestMessage(HttpMethod.Delete, $"{_url}/storage/v1/object/{_bucket}/{path}");
        req.Headers.Add("Authorization", $"Bearer {_serviceKey}");
        var res = await _http.SendAsync(req, ct);
        res.EnsureSuccessStatusCode();
    }

    private string BuildKey(string fileName)
    {
        var safe = Path.GetFileName(fileName).Replace(" ", "-");
        return $"{DateTime.UtcNow:yyyy/MM}/{Guid.NewGuid():N}-{safe}";
    }

    private async Task<string> PutAsync(string key, Stream content, string contentType, CancellationToken ct)
    {
        if (content.CanSeek) content.Position = 0;
        using var sc = new StreamContent(content);
        sc.Headers.ContentType = new System.Net.Http.Headers.MediaTypeHeaderValue(contentType);
        var req = new HttpRequestMessage(HttpMethod.Post, $"{_url}/storage/v1/object/{_bucket}/{key}")
        { Content = sc };
        req.Headers.Add("Authorization", $"Bearer {_serviceKey}");
        req.Headers.Add("x-upsert", "true");
        var res = await _http.SendAsync(req, ct);
        res.EnsureSuccessStatusCode();
        // Public URL form (bucket must be public, or generate a signed URL instead).
        return $"{_url}/storage/v1/object/public/{_bucket}/{key}";
    }
}
