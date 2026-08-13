namespace RBooking.Application.DTOs;

public class OperatorEarningsDto
{
    public decimal TotalCollected { get; set; }
    public decimal TotalCommission { get; set; }
    public decimal TotalNet { get; set; }
    public int ReservationsCount { get; set; }
    public List<AccommodationEarningsDto> ByAccommodation { get; set; } = new();
}

public class AccommodationEarningsDto
{
    public Guid AccommodationId { get; set; }
    public string AccommodationName { get; set; } = string.Empty;
    public decimal TotalCollected { get; set; }
    public decimal TotalCommission { get; set; }
    public decimal TotalNet { get; set; }
    public int ReservationsCount { get; set; }
}
