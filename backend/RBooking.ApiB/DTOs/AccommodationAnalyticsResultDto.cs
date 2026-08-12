namespace RBooking.ApiB.DTOs;

public class AccommodationAnalyticsResultDto
{
    public Guid AccommodationId { get; set; }
    public string AccommodationName { get; set; } = string.Empty;
    public int TotalReservations { get; set; }
    public decimal AverageTotalPrice { get; set; }
    public double AverageNumberOfGuests { get; set; }
    public double AverageStayNights { get; set; }
    public decimal TotalRevenue { get; set; }
    public int ProcessedBatchesCount { get; set; }
    public int BatchSize { get; set; }
    public DateTime CalculatedAt { get; set; } = DateTime.UtcNow;
    public int? TriggeredByReviewId { get; set; }
    public Guid TriggeredByReservationId { get; set; }
}
