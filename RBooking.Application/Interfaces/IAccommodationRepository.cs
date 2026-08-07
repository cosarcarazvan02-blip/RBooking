using RBooking.Application.DTOs;
using RBooking.Domain.Entities;

namespace RBooking.Application.Interfaces;

public interface IAccommodationRepository
{
    Task<IEnumerable<Accommodation>> GetAllAsync();
    Task<(IEnumerable<Accommodation> Items, int TotalCount, Dictionary<Guid, (double AvgRating, int ReviewCount)> RatingStats)> GetFilteredAsync(AccommodationFilterDto filter);
    Task<Accommodation?> GetByIdAsync(Guid id);
    Task<(double AvgRating, int ReviewCount)> GetRatingStatsAsync(Guid accommodationId);
    Task<IEnumerable<AccommodationDto>> GetReportDataAsync(AccommodationReportFilterDto? filter);
    Task<Accommodation> AddAsync(Accommodation accommodation);
    Task<Accommodation?> UpdateAsync(Accommodation accommodation);
    Task<bool> DeleteAsync(Guid id);
}
