using RBooking.Application.DTOs;
using RBooking.Domain.Entities;

namespace RBooking.Application.Interfaces;

public interface IReservationService
{
    Task<IEnumerable<ReservationDto>> GetAllReservationsAsync();
    Task<ReservationDto?> GetReservationByIdAsync(Guid id);
    Task<IEnumerable<ReservationDto>> GetReservationsByUserIdAsync(Guid userId);
    Task<ReservationDto> CreateReservationAsync(CreateReservationDto createReservationDto);
    Task<ReservationDto?> UpdateReservationStatusAsync(Guid id, ReservationStatus newStatus);
    Task<bool> CancelReservationAsync(Guid id);
}
