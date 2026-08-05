using Microsoft.EntityFrameworkCore;
using RBooking.Application.DTOs;
using RBooking.Application.Interfaces;
using RBooking.Domain.Entities;
using RBooking.Infrastructure.Data;

namespace RBooking.Infrastructure.Repositories;

public class AccommodationRepository : IAccommodationRepository
{
    private readonly AppDbContext _context;

    public AccommodationRepository(AppDbContext context)
    {
        _context = context;
    }

    public async Task<IEnumerable<Accommodation>> GetAllAsync()
    {
        return await _context.Accommodations.ToListAsync();
    }

    public async Task<(IEnumerable<Accommodation> Items, int TotalCount, Dictionary<Guid, (double AvgRating, int ReviewCount)> RatingStats)> GetFilteredAsync(AccommodationFilterDto filter)
    {
        var query = _context.Accommodations.AsQueryable();

        // 1. Filter by SearchLocation (City, Country, Location, Name)
        if (!string.IsNullOrWhiteSpace(filter.SearchLocation))
        {
            var term = filter.SearchLocation.Trim().ToLower();
            query = query.Where(a => a.City.ToLower().Contains(term)
                                  || a.Country.ToLower().Contains(term)
                                  || a.Location.ToLower().Contains(term)
                                  || a.Name.ToLower().Contains(term));
        }

        // 2. Filter by City & Country
        if (!string.IsNullOrWhiteSpace(filter.City))
        {
            var city = filter.City.Trim().ToLower();
            query = query.Where(a => a.City.ToLower() == city);
        }

        if (!string.IsNullOrWhiteSpace(filter.Country))
        {
            var country = filter.Country.Trim().ToLower();
            query = query.Where(a => a.Country.ToLower() == country);
        }

        // 3. Filter by Price
        if (filter.MinPrice.HasValue)
        {
            query = query.Where(a => a.PricePerNight >= filter.MinPrice.Value);
        }

        if (filter.MaxPrice.HasValue)
        {
            query = query.Where(a => a.PricePerNight <= filter.MaxPrice.Value);
        }

        // 4. Filter by AccommodationType
        if (!string.IsNullOrWhiteSpace(filter.AccommodationType))
        {
            var type = filter.AccommodationType.Trim().ToLower();
            query = query.Where(a => EF.Property<string>(a, "AccommodationType").ToLower() == type);
        }

        // 5. Compute Review Rating stats for Accommodations
        var reviewStats = await _context.Reviews
            .Where(r => r.Reservation != null)
            .GroupBy(r => r.Reservation!.AccommodationId)
            .Select(g => new
            {
                AccommodationId = g.Key,
                AvgRating = g.Average(r => (double)r.Rating),
                ReviewCount = g.Count()
            })
            .ToDictionaryAsync(x => x.AccommodationId, x => (x.AvgRating, x.ReviewCount));

        // 6. Filter by MinRating if specified
        if (filter.MinRating.HasValue)
        {
            var matchingIds = reviewStats
                .Where(kv => kv.Value.AvgRating >= filter.MinRating.Value)
                .Select(kv => kv.Key)
                .ToHashSet();

            query = query.Where(a => matchingIds.Contains(a.Id));
        }

        var totalCount = await query.CountAsync();

        var items = await query
            .OrderBy(a => a.Name)
            .Skip((filter.PageNumber - 1) * filter.PageSize)
            .Take(filter.PageSize)
            .ToListAsync();

        return (items, totalCount, reviewStats);
    }

    public async Task<Accommodation?> GetByIdAsync(Guid id)
    {
        return await _context.Accommodations.FirstOrDefaultAsync(a => a.Id == id);
    }

    public async Task<(double AvgRating, int ReviewCount)> GetRatingStatsAsync(Guid accommodationId)
    {
        var stats = await _context.Reviews
            .Where(r => r.Reservation != null && r.Reservation.AccommodationId == accommodationId)
            .GroupBy(r => r.Reservation!.AccommodationId)
            .Select(g => new
            {
                AvgRating = g.Average(r => (double)r.Rating),
                ReviewCount = g.Count()
            })
            .FirstOrDefaultAsync();

        return stats != null ? (stats.AvgRating, stats.ReviewCount) : (0.0, 0);
    }

    public async Task<Accommodation> AddAsync(Accommodation accommodation)
    {
        _context.Accommodations.Add(accommodation);
        await _context.SaveChangesAsync();
        return accommodation;
    }

    public async Task<Accommodation?> UpdateAsync(Accommodation accommodation)
    {
        _context.Accommodations.Update(accommodation);
        await _context.SaveChangesAsync();
        return accommodation;
    }

    public async Task<bool> DeleteAsync(Guid id)
    {
        var item = await _context.Accommodations.FindAsync(id);
        if (item == null) return false;

        _context.Accommodations.Remove(item);
        await _context.SaveChangesAsync();
        return true;
    }
}
