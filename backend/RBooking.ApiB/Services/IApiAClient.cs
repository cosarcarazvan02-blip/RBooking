using RBooking.ApiB.DTOs;

namespace RBooking.ApiB.Services;

public interface IApiAClient
{
    Task<string> GetServiceTokenAsync();
    Task<ApiAReservationDto?> GetReservationByIdAsync(Guid reservationId);
    Task<PagedApiAResultDto<ApiAReservationDto>?> GetReservationsByAccommodationPagedAsync(Guid accommodationId, int pageNumber, int pageSize);
}
