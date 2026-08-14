namespace RBooking.WebhookAPI.DTOs;

// Payload minimal primit de la API A - restul detaliilor se cer separat, service-to-service.
public class ReservationCreatedWebhookDto
{
    public Guid ReservationId { get; set; }
}
