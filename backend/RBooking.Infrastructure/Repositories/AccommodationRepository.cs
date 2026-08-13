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
        return await _context.Accommodations.Include(a => a.Images).ToListAsync();
    }

    public async Task<(IEnumerable<Accommodation> Items, int TotalCount, Dictionary<Guid, (double AvgRating, int ReviewCount)> RatingStats)> GetFilteredAsync(AccommodationFilterDto filter)
    {
        var query = _context.Accommodations.Include(a => a.Images).AsQueryable();

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
        return await _context.Accommodations.Include(a => a.Images).FirstOrDefaultAsync(a => a.Id == id);
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

    public async Task<HashSet<string>> GetExistingUniqueKeysAsync()
    {
        var list = await _context.Accommodations
            .Select(a => new
            {
                a.Name,
                a.City,
                a.Location,
                Type = EF.Property<string>(a, "AccommodationType")
            })
            .ToListAsync();

        return list.Select(x => $"{x.Name.Trim().ToLower()}|{x.City.Trim().ToLower()}|{x.Location.Trim().ToLower()}|{(x.Type ?? "").Trim().ToLower()}")
                   .ToHashSet();
    }

    public async Task AddRangeAsync(IEnumerable<Accommodation> accommodations)
    {
        await _context.Accommodations.AddRangeAsync(accommodations);
        await _context.SaveChangesAsync();
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

    public async Task<IEnumerable<AccommodationDto>> GetReportDataAsync(AccommodationReportFilterDto? filter)
    {
        var query = _context.Accommodations.AsQueryable();

        if (filter != null)
        {
            if (!string.IsNullOrWhiteSpace(filter.Name))
            {
                var name = filter.Name.Trim().ToLower();
                query = query.Where(a => a.Name.ToLower().Contains(name));
            }

            if (!string.IsNullOrWhiteSpace(filter.Description))
            {
                var desc = filter.Description.Trim().ToLower();
                query = query.Where(a => a.Description.ToLower().Contains(desc));
            }

            if (!string.IsNullOrWhiteSpace(filter.Location))
            {
                var loc = filter.Location.Trim().ToLower();
                query = query.Where(a => a.Location.ToLower().Contains(loc));
            }

            if (!string.IsNullOrWhiteSpace(filter.City))
            {
                var city = filter.City.Trim().ToLower();
                query = query.Where(a => a.City.ToLower().Contains(city));
            }

            if (!string.IsNullOrWhiteSpace(filter.Country))
            {
                var country = filter.Country.Trim().ToLower();
                query = query.Where(a => a.Country.ToLower().Contains(country));
            }

            if (filter.PricePerNight.HasValue)
            {
                query = query.Where(a => a.PricePerNight == filter.PricePerNight.Value);
            }

            if (filter.MinPrice.HasValue)
            {
                query = query.Where(a => a.PricePerNight >= filter.MinPrice.Value);
            }

            if (filter.MaxPrice.HasValue)
            {
                query = query.Where(a => a.PricePerNight <= filter.MaxPrice.Value);
            }

            if (filter.OperatorId.HasValue && filter.OperatorId.Value != Guid.Empty)
            {
                query = query.Where(a => a.OperatorId == filter.OperatorId.Value);
            }

            if (!string.IsNullOrWhiteSpace(filter.AccommodationType))
            {
                var type = filter.AccommodationType.Trim().ToLower();
                query = query.Where(a => EF.Property<string>(a, "AccommodationType").ToLower() == type);
            }

            if (filter.Stars.HasValue)
            {
                query = query.Where(a => a is Hotel && ((Hotel)a).Stars == filter.Stars.Value);
            }

            if (filter.HasPool.HasValue)
            {
                query = query.Where(a => a is Hotel && ((Hotel)a).HasPool == filter.HasPool.Value);
            }

            if (filter.HasRoomService.HasValue)
            {
                query = query.Where(a => a is Hotel && ((Hotel)a).HasRoomService == filter.HasRoomService.Value);
            }

            if (filter.MinTotalRooms.HasValue)
            {
                query = query.Where(a => a is Hotel && ((Hotel)a).TotalRooms >= filter.MinTotalRooms.Value);
            }

            if (filter.FloorNumber.HasValue)
            {
                query = query.Where(a => a is Apartment && ((Apartment)a).FloorNumber == filter.FloorNumber.Value);
            }

            if (filter.HasElevator.HasValue)
            {
                query = query.Where(a => a is Apartment && ((Apartment)a).HasElevator == filter.HasElevator.Value);
            }

            if (filter.MinNumberOfRooms.HasValue)
            {
                query = query.Where(a => a is Apartment && ((Apartment)a).NumberOfRooms >= filter.MinNumberOfRooms.Value);
            }

            if (filter.IsFurnished.HasValue)
            {
                query = query.Where(a => a is Apartment && ((Apartment)a).IsFurnished == filter.IsFurnished.Value);
            }

            if (filter.MaxBedInSharedRoomPrice.HasValue)
            {
                query = query.Where(a => a is Hostel && ((Hostel)a).BedInSharedRoomPrice <= filter.MaxBedInSharedRoomPrice.Value);
            }

            if (filter.HasSharedKitchen.HasValue)
            {
                query = query.Where(a => a is Hostel && ((Hostel)a).HasSharedKitchen == filter.HasSharedKitchen.Value);
            }

            if (filter.MinTotalBeds.HasValue)
            {
                query = query.Where(a => a is Hostel && ((Hostel)a).TotalBeds >= filter.MinTotalBeds.Value);
            }
        }

        var items = await query.ToListAsync();

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

        var dtos = items.Select(a =>
        {
            var (avgRating, reviewCount) = reviewStats.TryGetValue(a.Id, out var stat) ? stat : (0.0, 0);
            return MapToDto(a, avgRating, reviewCount);
        });

        if (filter != null)
        {
            if (filter.MinRating.HasValue)
            {
                dtos = dtos.Where(d => d.AverageRating >= filter.MinRating.Value);
            }

            if (filter.MaxRating.HasValue)
            {
                dtos = dtos.Where(d => d.AverageRating <= filter.MaxRating.Value);
            }

            if (filter.MinReviewsCount.HasValue)
            {
                dtos = dtos.Where(d => d.TotalReviewsCount >= filter.MinReviewsCount.Value);
            }
        }

        return dtos.ToList();
    }

    private static AccommodationDto MapToDto(Accommodation a, double avgRating, int reviewCount)
    {
        var dto = new AccommodationDto
        {
            Id = a.Id,
            Name = a.Name,
            Location = a.Location,
            City = a.City,
            Country = a.Country,
            PricePerNight = a.PricePerNight,
            Description = a.Description,
            OperatorId = a.OperatorId,
            AverageRating = Math.Round(avgRating, 1),
            TotalReviewsCount = reviewCount,
            AccommodationType = a.GetType().Name
        };

        if (a is Hotel hotel)
        {
            dto.Stars = hotel.Stars;
            dto.HasPool = hotel.HasPool;
            dto.HasRoomService = hotel.HasRoomService;
            dto.TotalRooms = hotel.TotalRooms;
        }
        else if (a is Apartment apartment)
        {
            dto.FloorNumber = apartment.FloorNumber;
            dto.HasElevator = apartment.HasElevator;
            dto.NumberOfRooms = apartment.NumberOfRooms;
            dto.IsFurnished = apartment.IsFurnished;
        }
        else if (a is Hostel hostel)
        {
            dto.BedInSharedRoomPrice = hostel.BedInSharedRoomPrice;
            dto.HasSharedKitchen = hostel.HasSharedKitchen;
            dto.TotalBeds = hostel.TotalBeds;
        }

        return dto;
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
