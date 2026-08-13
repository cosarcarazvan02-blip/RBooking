using RBooking.Application.DTOs;
using RBooking.Application.Interfaces;
using RBooking.Domain.Entities;

namespace RBooking.Application.Services;

public class WishlistService : IWishlistService
{
    private readonly IWishlistRepository _wishlistRepository;
    private readonly IAccommodationRepository _accommodationRepository;

    public WishlistService(
        IWishlistRepository wishlistRepository,
        IAccommodationRepository accommodationRepository)
    {
        _wishlistRepository = wishlistRepository;
        _accommodationRepository = accommodationRepository;
    }

    public async Task<IEnumerable<WishlistItemDto>> GetUserWishlistAsync(Guid userId)
    {
        var items = await _wishlistRepository.GetByUserIdAsync(userId);
        var dtos = new List<WishlistItemDto>();

        foreach (var item in items)
        {
            var (avgRating, _) = await _accommodationRepository.GetRatingStatsAsync(item.AccommodationId);
            dtos.Add(MapToDto(item, avgRating));
        }

        return dtos;
    }

    public async Task<WishlistItemDto> AddToWishlistAsync(Guid userId, Guid accommodationId)
    {
        var accommodation = await _accommodationRepository.GetByIdAsync(accommodationId);
        if (accommodation == null)
        {
            throw new ArgumentException($"Accommodation with ID {accommodationId} was not found.");
        }

        var existing = await _wishlistRepository.GetByUserAndAccommodationAsync(userId, accommodationId);
        if (existing != null)
        {
            var (avg, _) = await _accommodationRepository.GetRatingStatsAsync(accommodationId);
            return MapToDto(existing, avg);
        }

        var wishlistItem = new WishlistItem
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            AccommodationId = accommodationId,
            Accommodation = accommodation,
            CreatedAt = DateTime.UtcNow
        };

        var added = await _wishlistRepository.AddAsync(wishlistItem);
        var (avgRating, _) = await _accommodationRepository.GetRatingStatsAsync(accommodationId);
        return MapToDto(added, avgRating);
    }

    public async Task<bool> RemoveFromWishlistAsync(Guid userId, Guid accommodationId)
    {
        return await _wishlistRepository.DeleteAsync(userId, accommodationId);
    }

    public async Task<bool> IsInWishlistAsync(Guid userId, Guid accommodationId)
    {
        return await _wishlistRepository.ExistsAsync(userId, accommodationId);
    }

    private static WishlistItemDto MapToDto(WishlistItem item, double avgRating)
    {
        var acc = item.Accommodation;
        return new WishlistItemDto
        {
            Id = item.Id,
            UserId = item.UserId,
            AccommodationId = item.AccommodationId,
            AccommodationName = acc?.Name ?? "Accommodation",
            Location = acc?.Location ?? string.Empty,
            City = acc?.City,
            Country = acc?.Country,
            PricePerNight = acc?.PricePerNight ?? 0m,
            ImageUrl = acc?.Images?.FirstOrDefault(i => i.IsMain)?.FilePath ?? acc?.Images?.FirstOrDefault()?.FilePath,
            AccommodationType = acc?.GetType().Name ?? "Hotel",
            AverageRating = avgRating > 0 ? Math.Round(avgRating, 1) : null,
            CreatedAt = item.CreatedAt
        };
    }
}
