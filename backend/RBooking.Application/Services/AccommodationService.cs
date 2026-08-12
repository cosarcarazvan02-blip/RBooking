using RBooking.Application.DTOs;
using RBooking.Application.Interfaces;
using RBooking.Domain.Entities;
using RBooking.Domain.Enums;

namespace RBooking.Application.Services;

public class AccommodationService : IAccommodationService
{
    private readonly IAccommodationRepository _accommodationRepository;
    private readonly IWebhookSender _webhookSender;

    public AccommodationService(IAccommodationRepository accommodationRepository, IWebhookSender webhookSender)
    {
        _accommodationRepository = accommodationRepository;
        _webhookSender = webhookSender;
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

        if (!string.IsNullOrWhiteSpace(dto.ImageUrl))
        {
            accommodation.Images.Add(new AccommodationImage
            {
                AccommodationId = accommodation.Id,
                FilePath = dto.ImageUrl.Trim(),
                IsMain = true
            });
        }
        if (dto.ImageUrls != null && dto.ImageUrls.Any())
        {
            foreach (var url in dto.ImageUrls.Where(u => !string.IsNullOrWhiteSpace(u)))
            {
                if (url.Trim() != dto.ImageUrl?.Trim())
                {
                    accommodation.Images.Add(new AccommodationImage
                    {
                        AccommodationId = accommodation.Id,
                        FilePath = url.Trim(),
                        IsMain = false
                    });
                }
            }
        }

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
            OperatorId = a.OperatorId ?? string.Empty,
            AverageRating = Math.Round(avgRating, 1),
            TotalReviewsCount = reviewCount,
            AccommodationType = a.GetType().Name,
            ImageUrl = a.Images?.FirstOrDefault(i => i.IsMain)?.FilePath ?? a.Images?.FirstOrDefault()?.FilePath,
            ImageUrls = a.Images?.Select(i => i.FilePath).ToList() ?? new List<string>()
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

    public async Task<bool> UpdateAccommodationAsync(Guid id, Guid currentUserId, UserRole currentUserRole, CreateAccommodationDto dto)
    {
        var accommodation = await _accommodationRepository.GetByIdAsync(id);
        if (accommodation == null) return false;

        // Autorizare: Doar operatorul acelei cazări sau un Admin
        if (currentUserRole != UserRole.Admin && accommodation.OperatorId != currentUserId.ToString())
        {
            throw new UnauthorizedAccessException("Nu poți modifica o cazare care nu îți aparține.");
        }

        var oldSnapshot = BuildFieldSnapshot(accommodation);

        accommodation.Name = dto.Name;
        accommodation.Location = dto.Location;
        accommodation.City = dto.City;
        accommodation.Country = dto.Country;
        accommodation.PricePerNight = dto.PricePerNight;
        accommodation.Description = dto.Description;

        // Tip specific
        if (accommodation is Hotel hotel)
        {
            if (dto.Stars.HasValue) hotel.Stars = dto.Stars.Value;
            if (dto.HasPool.HasValue) hotel.HasPool = dto.HasPool.Value;
            if (dto.HasRoomService.HasValue) hotel.HasRoomService = dto.HasRoomService.Value;
            if (dto.TotalRooms.HasValue) hotel.TotalRooms = dto.TotalRooms.Value;
        }
        else if (accommodation is Apartment apartment)
        {
            if (dto.FloorNumber.HasValue) apartment.FloorNumber = dto.FloorNumber.Value;
            if (dto.HasElevator.HasValue) apartment.HasElevator = dto.HasElevator.Value;
            if (dto.NumberOfRooms.HasValue) apartment.NumberOfRooms = dto.NumberOfRooms.Value;
            if (dto.IsFurnished.HasValue) apartment.IsFurnished = dto.IsFurnished.Value;
        }
        else if (accommodation is Hostel hostel)
        {
            if (dto.BedInSharedRoomPrice.HasValue) hostel.BedInSharedRoomPrice = dto.BedInSharedRoomPrice.Value;
            if (dto.HasSharedKitchen.HasValue) hostel.HasSharedKitchen = dto.HasSharedKitchen.Value;
            if (dto.TotalBeds.HasValue) hostel.TotalBeds = dto.TotalBeds.Value;
        }

        var updated = await _accommodationRepository.UpdateAsync(accommodation);
        if (updated == null) return false;

        var newSnapshot = BuildFieldSnapshot(updated);
        var (oldValues, newValues) = DiffSnapshots(oldSnapshot, newSnapshot);

        if (oldValues.Count > 0)
        {
            await _webhookSender.SendAccommodationUpdatedAsync(new AccommodationUpdatedWebhookDto
            {
                AccommodationId = updated.Id,
                ModifiedByUserId = currentUserId,
                ModifiedAt = DateTime.UtcNow,
                OldValues = oldValues,
                NewValues = newValues
            });
        }

        return true;
    }

    /// <summary>
    /// Captures only the accommodation's own scalar fields (no related entities),
    /// used to compute the minimal old/new diff sent in the accommodation-updated webhook.
    /// </summary>
    private static Dictionary<string, object?> BuildFieldSnapshot(Accommodation a)
    {
        var snapshot = new Dictionary<string, object?>
        {
            ["Name"] = a.Name,
            ["Description"] = a.Description,
            ["Location"] = a.Location,
            ["City"] = a.City,
            ["Country"] = a.Country,
            ["PricePerNight"] = a.PricePerNight
        };

        if (a is Hotel hotel)
        {
            snapshot["Stars"] = hotel.Stars;
            snapshot["HasPool"] = hotel.HasPool;
            snapshot["HasRoomService"] = hotel.HasRoomService;
            snapshot["TotalRooms"] = hotel.TotalRooms;
        }
        else if (a is Apartment apartment)
        {
            snapshot["FloorNumber"] = apartment.FloorNumber;
            snapshot["HasElevator"] = apartment.HasElevator;
            snapshot["NumberOfRooms"] = apartment.NumberOfRooms;
            snapshot["IsFurnished"] = apartment.IsFurnished;
        }
        else if (a is Hostel hostel)
        {
            snapshot["BedInSharedRoomPrice"] = hostel.BedInSharedRoomPrice;
            snapshot["HasSharedKitchen"] = hostel.HasSharedKitchen;
            snapshot["TotalBeds"] = hostel.TotalBeds;
        }

        return snapshot;
    }

    private static (Dictionary<string, object?> OldValues, Dictionary<string, object?> NewValues) DiffSnapshots(
        Dictionary<string, object?> oldSnapshot, Dictionary<string, object?> newSnapshot)
    {
        var oldValues = new Dictionary<string, object?>();
        var newValues = new Dictionary<string, object?>();

        foreach (var (field, oldValue) in oldSnapshot)
        {
            var newValue = newSnapshot.TryGetValue(field, out var v) ? v : null;
            if (!Equals(oldValue, newValue))
            {
                oldValues[field] = oldValue;
                newValues[field] = newValue;
            }
        }

        return (oldValues, newValues);
    }

    public async Task<bool> DeleteAccommodationAsync(Guid id, Guid currentUserId, UserRole currentUserRole)
    {
        var accommodation = await _accommodationRepository.GetByIdAsync(id);
        if (accommodation == null) return false;

        // Autorizare: Doar operatorul acelei cazări sau un Admin
        if (currentUserRole != UserRole.Admin && accommodation.OperatorId != currentUserId.ToString())
        {
            throw new UnauthorizedAccessException("Nu poți șterge o cazare care nu îți aparține.");
        }

        return await _accommodationRepository.DeleteAsync(id);
    }
}