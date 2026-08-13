using Microsoft.EntityFrameworkCore;
using RBooking.Application.Interfaces;
using RBooking.Domain.Entities;
using RBooking.Infrastructure.Data;

namespace RBooking.Infrastructure.Repositories;

public class WishlistRepository : IWishlistRepository
{
    private readonly AppDbContext _context;

    public WishlistRepository(AppDbContext context)
    {
        _context = context;
    }

    public async Task<IEnumerable<WishlistItem>> GetByUserIdAsync(Guid userId)
    {
        return await _context.Wishlist
            .Include(w => w.Accommodation)
                .ThenInclude(a => a!.Images)
            .Where(w => w.UserId == userId)
            .OrderByDescending(w => w.CreatedAt)
            .ToListAsync();
    }

    public async Task<WishlistItem?> GetByUserAndAccommodationAsync(Guid userId, Guid accommodationId)
    {
        return await _context.Wishlist
            .Include(w => w.Accommodation)
                .ThenInclude(a => a!.Images)
            .FirstOrDefaultAsync(w => w.UserId == userId && w.AccommodationId == accommodationId);
    }

    public async Task<WishlistItem> AddAsync(WishlistItem item)
    {
        _context.Wishlist.Add(item);
        await _context.SaveChangesAsync();
        return item;
    }

    public async Task<bool> DeleteAsync(Guid userId, Guid accommodationId)
    {
        var item = await _context.Wishlist
            .FirstOrDefaultAsync(w => w.UserId == userId && w.AccommodationId == accommodationId);

        if (item == null) return false;

        _context.Wishlist.Remove(item);
        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<bool> DeleteByIdAsync(Guid id, Guid userId)
    {
        var item = await _context.Wishlist
            .FirstOrDefaultAsync(w => w.Id == id && w.UserId == userId);

        if (item == null) return false;

        _context.Wishlist.Remove(item);
        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<bool> ExistsAsync(Guid userId, Guid accommodationId)
    {
        return await _context.Wishlist
            .AnyAsync(w => w.UserId == userId && w.AccommodationId == accommodationId);
    }
}
