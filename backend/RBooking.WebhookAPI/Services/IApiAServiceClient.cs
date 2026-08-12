using RBooking.WebhookAPI.DTOs;

namespace RBooking.WebhookAPI.Services;

public interface IApiAServiceClient
{
    Task<PagedResultDto<ReservationDto>> GetFutureReservationsPageAsync(Guid accommodationId, int pageNumber, int pageSize);
}
