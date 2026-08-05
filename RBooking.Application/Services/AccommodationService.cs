using RBooking.Application.DTOs;
using RBooking.Application.Interfaces;
using RBooking.Domain.Entities;

namespace RBooking.Application.Services;

public class AccommodationService : IAccommodationService
{
    private readonly IAccommodationRepository _accommodationRepository;

    public AccommodationService(IAccommodationRepository accommodationRepository)
    {
        _accommodationRepository = accommodationRepository;
    }

    public async Task<PagedResultDto<AccommodationDto>> GetFilteredAccommodationsAsync(AccommodationFilterDto filter)
    {
        var (items, totalCount, ratingStats) = await _accommodationRepository.GetFilteredAsync(filter);

        var dtos = items.Select(a =>
        {
            var (avgRating, reviewCount) = ratingStats.TryGetValue(a.Id, out var stat) ? stat : (0.0, 0);
            return MapToDto(a, avgRating, reviewCount);
        });

        return new PagedResultDto<AccommodationDto>(dtos, totalCount, filter.PageNumber, filter.PageSize);
    }

    public async Task<AccommodationDto?> GetAccommodationByIdAsync(Guid id)
    {
        var accommodation = await _accommodationRepository.GetByIdAsync(id);
        if (accommodation == null) return null;

        var (avgRating, reviewCount) = await _accommodationRepository.GetRatingStatsAsync(id);
        return MapToDto(accommodation, avgRating, reviewCount);
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
}
