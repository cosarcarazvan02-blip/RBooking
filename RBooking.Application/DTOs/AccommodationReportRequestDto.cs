namespace RBooking.Application.DTOs;

/// <summary>
/// DTO pentru cererea de generare de raport (CSV, XLSX, PDF) pentru cazări.
/// Permite selectarea unui subset de coloane și filtrarea pe proprietăți non-unique.
/// </summary>
public class AccommodationReportRequestDto
{
    /// <summary>
    /// Formatul de export dorit: "csv", "xlsx", sau "pdf".
    /// Default este "csv".
    /// </summary>
    public string Format { get; set; } = "csv";

    /// <summary>
    /// Lista de coloane care trebuie incluse în raport.
    /// Coloane disponibile: Id, Name, Description, Location, City, Country, PricePerNight, OperatorId, AccommodationType, AverageRating, TotalReviewsCount, Stars, HasPool, HasRoomService, TotalRooms, FloorNumber, HasElevator, NumberOfRooms, IsFurnished, BedInSharedRoomPrice, HasSharedKitchen, TotalBeds.
    /// Dacă este null sau vid, sunt incluse toate coloanele.
    /// </summary>
    public List<string>? Columns { get; set; }

    /// <summary>
    /// Filtre cu coloane multiple non-unique identifier.
    /// </summary>
    public AccommodationReportFilterDto? Filters { get; set; }
}
