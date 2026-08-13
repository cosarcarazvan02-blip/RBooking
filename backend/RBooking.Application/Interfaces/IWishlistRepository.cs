using RBooking.Domain.Entities;

namespace RBooking.Application.Interfaces;

public interface IWishlistRepository
{
    Task<IEnumerable<WishlistItem>> GetByUserIdAsync(Guid userId);
    Task<WishlistItem?> GetByUserAndAccommodationAsync(Guid userId, Guid accommodationId);
    Task<WishlistItem> AddAsync(WishlistItem item);
    Task<bool> DeleteAsync(Guid userId, Guid accommodationId);
    Task<bool> DeleteByIdAsync(Guid id, Guid userId);
    Task<bool> ExistsAsync(Guid userId, Guid accommodationId);
}
