using Microsoft.AspNetCore.Http;

namespace RBooking.API.DTOs;

public class UploadAccommodationImageDto
{
    public int AccommodationId { get; set; }
    public IFormFile File { get; set; } = null!;
    public bool IsMain { get; set; } = false;
}