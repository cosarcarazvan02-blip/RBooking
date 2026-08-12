namespace RBooking.WebhookAPI.Entities;

/// <summary>
/// One row per accommodation-updated webhook received from API A: the fields that
/// changed, their old and new values, and who made the change.
/// </summary>
public class AccommodationChangeLog
{
    public int Id { get; set; }
    public Guid AccommodationId { get; set; }
    public Guid ModifiedByUserId { get; set; }
    public DateTime ChangedAt { get; set; }
    public string OldValuesJson { get; set; } = string.Empty;
    public string NewValuesJson { get; set; } = string.Empty;
}
