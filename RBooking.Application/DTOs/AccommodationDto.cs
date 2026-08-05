namespace RBooking.Application.DTOs;

/// <summary>
/// DTO pentru returnarea datelor despre o cazare către client/frontend.
/// Evită expunerea directă a entităților bazei de date.
/// </summary>
public class AccommodationDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public decimal PricePerNight { get; set; }
}