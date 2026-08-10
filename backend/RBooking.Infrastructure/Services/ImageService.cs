using Microsoft.Extensions.Hosting;
using RBooking.Application.Interfaces;

namespace RBooking.Infrastructure.Services;

public class ImageService : IImageService
{
    private readonly string _baseUploadsFolder;

    public ImageService(IHostEnvironment environment)
    {
        // Store uploads folder inside the content root path (e.g. RBooking.API/uploads)
        _baseUploadsFolder = Path.Combine(environment.ContentRootPath, "uploads");
        if (!Directory.Exists(_baseUploadsFolder))
        {
            Directory.CreateDirectory(_baseUploadsFolder);
        }
    }

    public async Task<string> SaveImageAsync(Stream fileStream, string fileName, string subFolder)
    {
        var targetFolder = Path.Combine(_baseUploadsFolder, subFolder);
        if (!Directory.Exists(targetFolder))
        {
            Directory.CreateDirectory(targetFolder);
        }

        var extension = Path.GetExtension(fileName);
        var uniqueFileName = $"{Guid.NewGuid()}{extension}";
        var fullPath = Path.Combine(targetFolder, uniqueFileName);

        using (var destinationStream = new FileStream(fullPath, FileMode.Create))
        {
            await fileStream.CopyToAsync(destinationStream);
        }

        // Relative path stored in database (e.g., "profile-images/guid.png")
        return Path.Combine(subFolder, uniqueFileName).Replace('\\', '/');
    }

    public Task DeleteImageAsync(string relativePath)
    {
        if (string.IsNullOrWhiteSpace(relativePath)) return Task.CompletedTask;

        var fullPath = Path.Combine(_baseUploadsFolder, relativePath);
        if (File.Exists(fullPath))
        {
            File.Delete(fullPath);
        }

        return Task.CompletedTask;
    }

    public async Task<(byte[] FileBytes, string ContentType)?> GetImageAsync(string relativePath)
    {
        if (string.IsNullOrWhiteSpace(relativePath)) return null;

        var fullPath = Path.Combine(_baseUploadsFolder, relativePath);
        if (!File.Exists(fullPath)) return null;

        var bytes = await File.ReadAllBytesAsync(fullPath);
        var contentType = GetContentType(fullPath);

        return (bytes, contentType);
    }

    private static string GetContentType(string path)
    {
        var ext = Path.GetExtension(path).ToLowerInvariant();
        return ext switch
        {
            ".jpg" or ".jpeg" => "image/jpeg",
            ".png" => "image/png",
            ".gif" => "image/gif",
            ".webp" => "image/webp",
            ".svg" => "image/svg+xml",
            _ => "application/octet-stream"
        };
    }
}
