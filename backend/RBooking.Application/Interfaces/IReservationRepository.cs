using RBooking.Domain.Entities;

namespace RBooking.Application.Interfaces;

public interface IReservationRepository
{
    Task<IEnumerable<Reservation>> GetAllAsync();
    Task<(IEnumerable<Reservation> Items, int TotalCount)> GetPagedAsync(int pageNumber, int pageSize);
    Task<Reservation?> GetByIdAsync(Guid id);
    Task<IEnumerable<Reservation>> GetByUserIdAsync(Guid userId);
    Task<(IEnumerable<Reservation> Items, int TotalCount)> GetPagedByUserIdAsync(Guid userId, int pageNumber, int pageSize);
    Task<IEnumerable<Reservation>> GetByAccommodationIdAsync(Guid accommodationId);
    Task<(IEnumerable<Reservation> Items, int TotalCount)> GetPagedFutureByAccommodationIdAsync(Guid accommodationId, int pageNumber, int pageSize);
    Task<(IEnumerable<Reservation> Items, int TotalCount)> GetPagedByAccommodationIdAsync(Guid accommodationId, int pageNumber, int pageSize);
    Task<Reservation> AddAsync(Reservation reservation);
    Task<Reservation?> UpdateAsync(Reservation reservation);
    Task<bool> DeleteAsync(Guid id);
}
