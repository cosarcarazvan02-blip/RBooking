using Microsoft.AspNetCore.Http;

namespace RBooking.API.DTOs;

public class UploadAccommodationImageDto
{
    public Guid AccommodationId { get; set; }
    public IFormFile File { get; set; } = null!;
    public bool IsMain { get; set; } = false;
}