namespace RBooking.Application.Interfaces;

public interface IWebhookSenderService
{
    Task SendReviewCreatedWebhookAsync(int reviewId, Guid reservationId);
}
