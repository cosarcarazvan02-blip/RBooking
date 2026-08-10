namespace RBooking.Application.DTOs;

/// <summary>
/// DTO pentru returnarea datelor despre o cazare către client/frontend.
/// Evită expunerea directă a entităților bazei de date.
/// </summary>
public class AccommodationDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Location { get; set; } = string.Empty;
    public string City { get; set; } = string.Empty;
    public string Country { get; set; } = string.Empty;
    public decimal PricePerNight { get; set; }
    public decimal BasePricePerNight => PricePerNight;
    public string Description { get; set; } = string.Empty;
    public string OperatorId { get; set; } = string.Empty;
    public string AccommodationType { get; set; } = string.Empty;
    public double AverageRating { get; set; }
    public int TotalReviewsCount { get; set; }
    public string? ImageUrl { get; set; }
    public List<string> ImageUrls { get; set; } = new();

    // Hotel specific
    public int? Stars { get; set; }
    public bool? HasPool { get; set; }
    public bool? HasRoomService { get; set; }
    public int? TotalRooms { get; set; }

    // Apartment specific
    public int? FloorNumber { get; set; }
    public bool? HasElevator { get; set; }
    public int? NumberOfRooms { get; set; }
    public bool? IsFurnished { get; set; }

    // Hostel specific
    public decimal? BedInSharedRoomPrice { get; set; }
    public bool? HasSharedKitchen { get; set; }
    public int? TotalBeds { get; set; }
}
