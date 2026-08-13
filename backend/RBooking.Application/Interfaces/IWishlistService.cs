using RBooking.Application.DTOs;

namespace RBooking.Application.Interfaces;

public interface IWishlistService
{
    Task<IEnumerable<WishlistItemDto>> GetUserWishlistAsync(Guid userId);
    Task<WishlistItemDto> AddToWishlistAsync(Guid userId, Guid accommodationId);
    Task<bool> RemoveFromWishlistAsync(Guid userId, Guid accommodationId);
    Task<bool> IsInWishlistAsync(Guid userId, Guid accommodationId);
}
