namespace RBooking.Application.DTOs;

/// <summary>
/// DTO pentru filtrarea pe mai multe coloane în raportul de cazări.
/// Conține filtre pentru fiecare coloană non-unique identifier.
/// </summary>
public class AccommodationReportFilterDto
{
    public string? Name { get; set; }
    public string? Description { get; set; }
    public string? Location { get; set; }
    public string? City { get; set; }
    public string? Country { get; set; }
    public decimal? PricePerNight { get; set; }
    public decimal? MinPrice { get; set; }
    public decimal? MaxPrice { get; set; }
    public Guid? OperatorId { get; set; }
    public string? AccommodationType { get; set; }
    public double? MinRating { get; set; }
    public double? MaxRating { get; set; }
    public int? MinReviewsCount { get; set; }

    // Hotel specific filters
    public int? Stars { get; set; }
    public bool? HasPool { get; set; }
    public bool? HasRoomService { get; set; }
    public int? MinTotalRooms { get; set; }

    // Apartment specific filters
    public int? FloorNumber { get; set; }
    public bool? HasElevator { get; set; }
    public int? MinNumberOfRooms { get; set; }
    public bool? IsFurnished { get; set; }

    // Hostel specific filters
    public decimal? MaxBedInSharedRoomPrice { get; set; }
    public bool? HasSharedKitchen { get; set; }
    public int? MinTotalBeds { get; set; }
}
