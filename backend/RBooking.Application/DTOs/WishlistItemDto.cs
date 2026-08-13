namespace RBooking.Application.DTOs;

public class WishlistItemDto
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public Guid AccommodationId { get; set; }
    public string AccommodationName { get; set; } = string.Empty;
    public string Location { get; set; } = string.Empty;
    public string? City { get; set; }
    public string? Country { get; set; }
    public decimal PricePerNight { get; set; }
    public string? ImageUrl { get; set; }
    public string AccommodationType { get; set; } = string.Empty;
    public double? AverageRating { get; set; }
    public DateTime CreatedAt { get; set; }
}
