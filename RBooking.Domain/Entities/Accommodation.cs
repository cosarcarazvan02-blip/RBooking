namespace RBooking.Domain.Entities;

public abstract class Accommodation
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string Name { get; set; } = string.Empty;
    public string Address { get; set; } = string.Empty;
    public string City { get; set; } = string.Empty;
    public string Country { get; set; } = string.Empty;
    public decimal BasePricePerNight { get; set; }
    public string Description { get; set; } = string.Empty;
}
