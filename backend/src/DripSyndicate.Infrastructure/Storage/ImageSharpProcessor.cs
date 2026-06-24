using DripSyndicate.Application.Common.Interfaces;
using SixLabors.ImageSharp;
using SixLabors.ImageSharp.Processing;
using SixLabors.ImageSharp.Formats.Webp;

namespace DripSyndicate.Infrastructure.Storage;

/// <summary>Crop / resize / thumbnail using SixLabors.ImageSharp. Output normalised to WebP.</summary>
public class ImageSharpProcessor : IImageProcessor
{
    public async Task<(Stream stream, int width, int height)> ResizeAsync(Stream input, int width, int? height = null)
    {
        using var image = await Image.LoadAsync(input);
        image.Mutate(x => x.Resize(new ResizeOptions
        {
            Mode = ResizeMode.Max,
            Size = new Size(width, height ?? 0)
        }));
        var output = new MemoryStream();
        await image.SaveAsync(output, new WebpEncoder { Quality = 82 });
        output.Position = 0;
        return (output, image.Width, image.Height);
    }

    public async Task<(Stream stream, int width, int height)> CropAsync(Stream input, int x, int y, int width, int height)
    {
        using var image = await Image.LoadAsync(input);
        image.Mutate(c => c.Crop(new Rectangle(x, y, width, height)));
        var output = new MemoryStream();
        await image.SaveAsync(output, new WebpEncoder { Quality = 82 });
        output.Position = 0;
        return (output, image.Width, image.Height);
    }

    public async Task<Stream> ThumbnailAsync(Stream input, int size = 320)
    {
        using var image = await Image.LoadAsync(input);
        image.Mutate(x => x.Resize(new ResizeOptions { Mode = ResizeMode.Crop, Size = new Size(size, size) }));
        var output = new MemoryStream();
        await image.SaveAsync(output, new WebpEncoder { Quality = 80 });
        output.Position = 0;
        return output;
    }
}
