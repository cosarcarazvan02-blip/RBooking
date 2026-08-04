using RBooking.Domain.Entities;

namespace RBooking.Application.Interfaces;

public interface IReservationRepository
{
    Task<IEnumerable<Reservation>> GetAllAsync();
    Task<Reservation?> GetByIdAsync(Guid id);
    Task<IEnumerable<Reservation>> GetByUserIdAsync(Guid userId);
    Task<IEnumerable<Reservation>> GetByAccommodationIdAsync(Guid accommodationId);
    Task<Reservation> AddAsync(Reservation reservation);
    Task<Reservation?> UpdateAsync(Reservation reservation);
    Task<bool> DeleteAsync(Guid id);
}
