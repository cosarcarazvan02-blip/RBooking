using Microsoft.EntityFrameworkCore;
using RBooking.Application.Interfaces;
using RBooking.Domain.Entities;
using RBooking.Infrastructure.Data;

namespace RBooking.Infrastructure.Repositories;

public class ReviewRepository : IReviewRepository
{
    private readonly AppDbContext _context;

    public ReviewRepository(AppDbContext context)
    {
        _context = context;
    }

    public async Task<IEnumerable<Review>> GetByAccommodationIdAsync(Guid accommodationId)
    {
        return await _context.Reviews
            .Include(r => r.Reservation)
                .ThenInclude(res => res.User)
            .Include(r => r.Reservation)
                .ThenInclude(res => res.Accommodation)
            .Where(r => r.Reservation.AccommodationId == accommodationId)
            .ToListAsync();
    }

    public async Task<Review?> GetByIdAsync(int id)
    {
        return await _context.Reviews
            .Include(r => r.Reservation)
                .ThenInclude(res => res.User)
            .Include(r => r.Reservation)
                .ThenInclude(res => res.Accommodation)
            .FirstOrDefaultAsync(r => r.Id == id);
    }

    public async Task<Review> AddAsync(Review review)
    {
        await _context.Reviews.AddAsync(review);
        await _context.SaveChangesAsync();
        return review;
    }

    public async Task<bool> DeleteAsync(int id)
    {
        var review = await _context.Reviews.FindAsync(id);
        if (review == null) return false;

        _context.Reviews.Remove(review);
        await _context.SaveChangesAsync();
        return true;
    }
}
