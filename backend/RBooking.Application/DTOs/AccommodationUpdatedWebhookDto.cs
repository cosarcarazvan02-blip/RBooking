namespace RBooking.Application.DTOs;

public class AccommodationUpdatedWebhookDto
{
    public Guid AccommodationId { get; set; }
    public Guid ModifiedByUserId { get; set; }
    public DateTime ModifiedAt { get; set; }
    public Dictionary<string, object?> OldValues { get; set; } = new();
    public Dictionary<string, object?> NewValues { get; set; } = new();
}
