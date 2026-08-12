using RBooking.Application.DTOs;

namespace RBooking.Application.Interfaces;

public interface IWebhookSender
{
    /// <summary>
    /// Fire-and-forget-style delivery to API B. Implementations must never throw -
    /// webhook delivery failures must not fail the accommodation update request itself.
    /// </summary>
    Task SendAccommodationUpdatedAsync(AccommodationUpdatedWebhookDto payload);
}
