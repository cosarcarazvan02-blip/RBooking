using RBooking.Domain.Entities;

namespace RBooking.Application.Interfaces;

public interface IReviewRepository
{
    Task<IEnumerable<Review>> GetByAccommodationIdAsync(Guid accommodationId);
    Task<Review?> GetByIdAsync(int id);
    Task<Review?> GetByReservationIdAsync(Guid reservationId);
    Task<bool> HasReviewForReservationAsync(Guid reservationId);
    Task<Review> AddAsync(Review review);
    Task<bool> DeleteAsync(int id);
}
