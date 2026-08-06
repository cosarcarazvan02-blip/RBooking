using RBooking.Application.DTOs;

namespace RBooking.Application.Interfaces;

public interface IAccommodationService
{
    Task<PagedResultDto<AccommodationDto>> GetFilteredAccommodationsAsync(AccommodationFilterDto filter);
    Task<AccommodationDto?> GetAccommodationByIdAsync(Guid id);
    Task<AccommodationDto> CreateAccommodationAsync(Guid currentUserId, CreateAccommodationDto dto);
}
