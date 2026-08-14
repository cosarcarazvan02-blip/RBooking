using RBooking.Application.DTOs;

namespace RBooking.Application.Interfaces;

public interface IWebhookSender
{
    /// <summary>
    /// Fire-and-forget-style delivery to API B. Implementations must never throw -
    /// webhook delivery failures must not fail the accommodation update request itself.
    /// </summary>
    Task SendAccommodationUpdatedAsync(AccommodationUpdatedWebhookDto payload);

    /// <summary>
    /// Same target/scheme as SendAccommodationUpdatedAsync, different event - notifies
    /// WebhookAPI that a new reservation was made, so it can email the operator. Must
    /// never throw - reservation creation must not fail because of this.
    /// </summary>
    Task SendReservationCreatedAsync(ReservationCreatedWebhookDto payload);
}
