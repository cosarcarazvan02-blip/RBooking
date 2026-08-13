namespace RBooking.Application.DTOs;

// Tot ce are nevoie WebhookAPI ca să construiască emailul către operator, fără să mai facă
// alte cereri suplimentare - un singur call service-to-service.
public class ReservationNotificationDetailsDto
{
    public Guid ReservationId { get; set; }
    public DateTime ReservationCreatedAt { get; set; }
    public DateTime CheckInDate { get; set; }
    public DateTime CheckOutDate { get; set; }
    public int NumberOfGuests { get; set; }
    public decimal TotalPrice { get; set; }
    public decimal PlatformFeeRate { get; set; }
    public decimal PlatformFeeAmount { get; set; }
    public decimal OperatorPayoutAmount { get; set; }

    public string AccommodationName { get; set; } = string.Empty;

    public string GuestName { get; set; } = string.Empty;
    public string GuestEmail { get; set; } = string.Empty;

    public string OperatorFirstName { get; set; } = string.Empty;
    public string OperatorEmail { get; set; } = string.Empty;
}
