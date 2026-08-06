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

    public async Task<AccommodationDto> CreateAccommodationAsync(Guid currentUserId, CreateAccommodationDto dto)
    {
        // Poți adapta crearea în funcție de tipul de cazare trimis în DTO (Hotel, Apartment, Hostel)
        Accommodation accommodation = dto.AccommodationType?.ToLower() switch
        {
            "hotel" => new Hotel
            {
                Stars = dto.Stars ?? 3,
                HasPool = dto.HasPool ?? false,
                HasRoomService = dto.HasRoomService ?? false,
                TotalRooms = dto.TotalRooms ?? 10
            },
            "apartment" => new Apartment
            {
                FloorNumber = dto.FloorNumber ?? 1,
                HasElevator = dto.HasElevator ?? false,
                NumberOfRooms = dto.NumberOfRooms ?? 2,
                IsFurnished = dto.IsFurnished ?? true
            },
            "hostel" => new Hostel
            {
                BedInSharedRoomPrice = dto.BedInSharedRoomPrice ?? 50,
                HasSharedKitchen = dto.HasSharedKitchen ?? true,
                TotalBeds = dto.TotalBeds ?? 20
            },
            _ => throw new ArgumentException("Tip de cazare invalid.")
        };

        accommodation.Id = Guid.NewGuid();
        accommodation.Name = dto.Name;
        accommodation.Location = dto.Location;
        accommodation.City = dto.City;
        accommodation.Country = dto.Country;
        accommodation.PricePerNight = dto.PricePerNight;
        accommodation.Description = dto.Description;
        accommodation.OperatorId = currentUserId.ToString();

        var created = await _accommodationRepository.AddAsync(accommodation);
        return MapToDto(created, 0.0, 0);
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