namespace RBooking.Application.DTOs;

// Payload minimal, ca la review-created: WebhookAPI cere restul detaliilor de la API A
// prin endpoint-ul service-to-service, nu le duplicăm aici.
public class ReservationCreatedWebhookDto
{
    public Guid ReservationId { get; set; }
}
