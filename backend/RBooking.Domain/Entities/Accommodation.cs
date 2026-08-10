namespace RBooking.Domain.Entities;

public class Accommodation
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string Location { get; set; } = string.Empty;
    public string City { get; set; } = string.Empty;
    public string Country { get; set; } = string.Empty;
    public decimal PricePerNight { get; set; }
    public string OperatorId { get; set; } = string.Empty;
    public ICollection<AccommodationImage> Images { get; set; } = new List<AccommodationImage>();
}
