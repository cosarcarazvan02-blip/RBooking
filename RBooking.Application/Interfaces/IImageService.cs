namespace RBooking.Application.Interfaces;

public interface IImageService
{
    /// <summary>
    /// Saves an image stream to disk in a specified subfolder and returns the relative file path.
    /// </summary>
    Task<string> SaveImageAsync(Stream fileStream, string fileName, string subFolder);

    /// <summary>
    /// Deletes an image from disk if it exists.
    /// </summary>
    Task DeleteImageAsync(string relativePath);

    /// <summary>
    /// Reads an image from disk by relative path and returns its byte content and content-type.
    /// </summary>
    Task<(byte[] FileBytes, string ContentType)?> GetImageAsync(string relativePath);
}
