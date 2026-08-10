using Microsoft.AspNetCore.Http;

namespace RBooking.API.DTOs;

public class UploadAccommodationImageDto
{
    public Guid AccommodationId { get; set; }
    public IFormFile? File { get; set; }
    public string? ImageUrl { get; set; }
    public bool IsMain { get; set; } = false;
}