namespace RBooking.ApiB.DTOs;

public class ReviewCreatedWebhookDto
{
    public string EventType { get; set; } = string.Empty;
    public int? ReviewId { get; set; }
    public Guid ReservationId { get; set; }
    public DateTimeOffset? Timestamp { get; set; }
}
