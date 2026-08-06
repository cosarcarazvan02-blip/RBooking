using RBooking.Application.DTOs;
using RBooking.Domain.Entities;
using RBooking.Domain.Enums;

namespace RBooking.Application.Interfaces;

public interface IReservationService
{
    Task<IEnumerable<ReservationDto>> GetAllReservationsAsync();
    Task<PagedResultDto<ReservationDto>> GetPagedReservationsAsync(PaginationParamsDto paginationParams);
    Task<ReservationDto?> GetReservationByIdAsync(Guid id);
    Task<IEnumerable<ReservationDto>> GetReservationsByUserIdAsync(Guid userId);
    Task<PagedResultDto<ReservationDto>> GetPagedReservationsByUserIdAsync(Guid userId, PaginationParamsDto paginationParams);
    Task<ReservationDto> CreateReservationAsync(CreateReservationDto createReservationDto);
    Task<ReservationDto?> UpdateReservationStatusAsync(Guid id, ReservationStatus newStatus);
    Task<bool> CancelReservationAsync(Guid id);
    Task<bool> DeleteReservationAsync(Guid id, Guid currentUserId, RBooking.Domain.Enums.UserRole currentUserRole);
}