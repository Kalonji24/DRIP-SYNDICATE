using DripSyndicate.Application.Common.Interfaces;
using DripSyndicate.Domain.Entities;
using DripSyndicate.Domain.Enums;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace DripSyndicate.API.Controllers;

[ApiController]
[Authorize(Policy = "Staff")]
[Route("api/v1/admin/media")]
public class AdminMediaController : ControllerBase
{
    private readonly IApplicationDbContext _db;
    private readonly IMediaStorage _storage;
    private readonly IImageProcessor _images;

    public AdminMediaController(IApplicationDbContext db, IMediaStorage storage, IImageProcessor images)
    { _db = db; _storage = storage; _images = images; }

    private static readonly string[] AllowedImages = { "image/jpeg", "image/png", "image/webp", "image/gif" };
    private static readonly string[] AllowedVideos = { "video/mp4", "video/webm", "video/quicktime" };

    [HttpGet]
    public async Task<IActionResult> List([FromQuery] MediaScope? scope, CancellationToken ct)
    {
        var q = _db.MediaAssets.AsNoTracking().AsQueryable();
        if (scope is MediaScope s) q = q.Where(m => m.Scope == s);
        return Ok(await q.OrderByDescending(m => m.CreatedAt).Take(200).ToListAsync(ct));
    }

    /// <summary>Upload an image. Optional resizeWidth; thumbnail auto-generated.</summary>
    [HttpPost("images")]
    [RequestSizeLimit(20_000_000)]
    public async Task<IActionResult> UploadImage(IFormFile file,
        [FromQuery] MediaScope scope = MediaScope.Other,
        [FromQuery] int? resizeWidth = null, [FromQuery] Guid? ownerId = null, CancellationToken ct = default)
    {
        if (file is null || file.Length == 0) return BadRequest(new { error = "No file." });
        if (!AllowedImages.Contains(file.ContentType)) return BadRequest(new { error = "Unsupported image type." });

        await using var stream = file.OpenReadStream();
        var stored = await _storage.UploadImageAsync(stream, file.FileName, file.ContentType,
            generateThumbnail: true, resizeWidth: resizeWidth, ct: ct);

        var asset = Persist(stored, MediaType.Image, scope, ownerId);
        await _db.SaveChangesAsync(ct);
        return Ok(asset);
    }

    /// <summary>Upload a video (promo / product).</summary>
    [HttpPost("videos")]
    [RequestSizeLimit(200_000_000)]
    public async Task<IActionResult> UploadVideo(IFormFile file,
        [FromQuery] MediaScope scope = MediaScope.Promo, CancellationToken ct = default)
    {
        if (file is null || file.Length == 0) return BadRequest(new { error = "No file." });
        if (!AllowedVideos.Contains(file.ContentType)) return BadRequest(new { error = "Unsupported video type." });

        await using var stream = file.OpenReadStream();
        var stored = await _storage.UploadVideoAsync(stream, file.FileName, file.ContentType, ct);
        var asset = Persist(stored, MediaType.Video, scope, null);
        await _db.SaveChangesAsync(ct);
        return Ok(asset);
    }

    /// <summary>Replace an existing image asset in place.</summary>
    [HttpPut("{id:guid}/replace")]
    public async Task<IActionResult> Replace(Guid id, IFormFile file, CancellationToken ct)
    {
        var asset = await _db.MediaAssets.FirstOrDefaultAsync(m => m.Id == id, ct);
        if (asset is null) return NotFound();
        await using var stream = file.OpenReadStream();
        var stored = await _storage.ReplaceImageAsync(asset.Path, stream, file.FileName, file.ContentType, ct);
        asset.Path = stored.Path; asset.Url = stored.Url; asset.ThumbnailUrl = stored.ThumbnailUrl;
        asset.SizeBytes = stored.SizeBytes; asset.Width = stored.Width; asset.Height = stored.Height;
        await _db.SaveChangesAsync(ct);
        return Ok(asset);
    }

    /// <summary>Crop an uploaded image (x,y,width,height) and store as a new asset.</summary>
    [HttpPost("crop")]
    public async Task<IActionResult> Crop(IFormFile file,
        [FromQuery] int x, [FromQuery] int y, [FromQuery] int width, [FromQuery] int height,
        [FromQuery] MediaScope scope = MediaScope.Other, CancellationToken ct = default)
    {
        await using var input = file.OpenReadStream();
        var (cropped, _, _) = await _images.CropAsync(input, x, y, width, height);
        var stored = await _storage.UploadImageAsync(cropped, "cropped.webp", "image/webp", true, null, ct);
        var asset = Persist(stored, MediaType.Image, scope, null);
        await _db.SaveChangesAsync(ct);
        return Ok(asset);
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id, CancellationToken ct)
    {
        var asset = await _db.MediaAssets.FirstOrDefaultAsync(m => m.Id == id, ct);
        if (asset is null) return NotFound();
        await _storage.DeleteAsync(asset.Path, ct);
        _db.MediaAssets.Remove(asset);
        await _db.SaveChangesAsync(ct);
        return NoContent();
    }

    // -------- Homepage banners --------
    [HttpGet("/api/v1/banners")]
    [AllowAnonymous]
    public async Task<IActionResult> Banners(CancellationToken ct) =>
        Ok(await _db.Banners.AsNoTracking().Where(b => b.IsActive)
            .OrderBy(b => b.Position).ToListAsync(ct));

    [HttpPost("banners")]
    public async Task<IActionResult> CreateBanner(Banner banner, CancellationToken ct)
    {
        _db.Banners.Add(banner);
        await _db.SaveChangesAsync(ct);
        return Ok(new { banner.Id });
    }

    [HttpDelete("banners/{id:guid}")]
    public async Task<IActionResult> DeleteBanner(Guid id, CancellationToken ct)
    {
        var b = await _db.Banners.FirstOrDefaultAsync(x => x.Id == id, ct);
        if (b is null) return NotFound();
        _db.Banners.Remove(b);
        await _db.SaveChangesAsync(ct);
        return NoContent();
    }

    // -------- Promo videos --------
    [HttpGet("/api/v1/promo-videos")]
    [AllowAnonymous]
    public async Task<IActionResult> PromoVideos(CancellationToken ct) =>
        Ok(await _db.PromoVideos.AsNoTracking().Where(v => v.IsActive)
            .OrderBy(v => v.Position).ToListAsync(ct));

    [HttpPost("promo-videos")]
    public async Task<IActionResult> CreatePromo(PromoVideo video, CancellationToken ct)
    {
        _db.PromoVideos.Add(video);
        await _db.SaveChangesAsync(ct);
        return Ok(new { video.Id });
    }

    private MediaAsset Persist(StoredMedia stored, MediaType type, MediaScope scope, Guid? ownerId)
    {
        var asset = new MediaAsset
        {
            Path = stored.Path, Url = stored.Url, ThumbnailUrl = stored.ThumbnailUrl,
            Type = type, Scope = scope, SizeBytes = stored.SizeBytes,
            Width = stored.Width, Height = stored.Height, ContentType = stored.ContentType,
            OwnerEntityId = ownerId
        };
        _db.MediaAssets.Add(asset);
        return asset;
    }
}
