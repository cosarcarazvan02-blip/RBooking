using RBooking.Application.DTOs;
using RBooking.Domain.Enums;

namespace RBooking.Application.Interfaces;

public interface IAccommodationService
{
    Task<PagedResultDto<AccommodationDto>> GetFilteredAccommodationsAsync(AccommodationFilterDto filter);
    Task<AccommodationDto?> GetAccommodationByIdAsync(Guid id);
    Task<AccommodationDto> CreateAccommodationAsync(Guid currentUserId, CreateAccommodationDto dto);
    Task<bool> UpdateAccommodationAsync(Guid id, Guid currentUserId, UserRole currentUserRole, CreateAccommodationDto dto);
    Task<bool> DeleteAccommodationAsync(Guid id, Guid currentUserId, UserRole currentUserRole);
}

