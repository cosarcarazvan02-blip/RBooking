namespace RBooking.Application.DTOs;

public class CreateAccommodationDto
{
    public string Name { get; set; } = string.Empty;
    public string Location { get; set; } = string.Empty;
    public string City { get; set; } = string.Empty;
    public string Country { get; set; } = string.Empty;
    public decimal PricePerNight { get; set; }
    public string Description { get; set; } = string.Empty;
    public string AccommodationType { get; set; } = string.Empty;
    public string? ImageUrl { get; set; }
    public List<string>? ImageUrls { get; set; }

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
