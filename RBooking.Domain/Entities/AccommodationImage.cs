namespace RBooking.Domain.Entities;

public class AccommodationImage
{
    public int Id { get; set; }
    public string FilePath { get; set; } = string.Empty;
    public bool IsMain { get; set; } = false;
    public Guid AccommodationId { get; set; }
    public Accommodation Accommodation { get; set; } = null!;
}