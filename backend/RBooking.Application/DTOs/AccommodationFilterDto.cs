namespace RBooking.Application.DTOs;

public class AccommodationFilterDto : PaginationParamsDto
{
    public string? SearchLocation { get; set; }
    public string? City { get; set; }
    public string? Country { get; set; }
    public decimal? MinPrice { get; set; }
    public decimal? MaxPrice { get; set; }
    public double? MinRating { get; set; }
    public string? AccommodationType { get; set; }
    public Guid? OperatorId { get; set; }
    public int? Stars { get; set; }
    public bool? HasPool { get; set; }
}
