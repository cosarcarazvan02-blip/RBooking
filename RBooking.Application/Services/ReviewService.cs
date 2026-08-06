using RBooking.Application.DTOs;
using RBooking.Application.Interfaces;
using RBooking.Domain.Entities;

namespace RBooking.Application.Services;

public class ReviewService : IReviewService
{
    private readonly IReviewRepository _reviewRepository;
    private readonly IReservationRepository _reservationRepository;

    public ReviewService(
        IReviewRepository reviewRepository,
        IReservationRepository reservationRepository)
    {
        _reviewRepository = reviewRepository;
        _reservationRepository = reservationRepository;
    }

    public async Task<IEnumerable<ReviewDto>> GetReviewsByAccommodationIdAsync(Guid accommodationId)
    {
        var reviews = await _reviewRepository.GetByAccommodationIdAsync(accommodationId);
        return reviews.Select(MapToDto);
    }

    public async Task<ReviewDto> CreateReviewAsync(Guid currentUserId, CreateReviewDto dto)
    {
        var reservation = await _reservationRepository.GetByIdAsync(dto.ReservationId);
        if (reservation == null || reservation.UserId != currentUserId)
        {
            throw new InvalidOperationException("Poți lăsa o recenzie numai pentru o rezervare validă efectuată de tine.");
        }

        var review = new Review
        {
            ReservationId = dto.ReservationId,
            Rating = dto.Rating,
            Comment = dto.Comment,
            CreatedAt = DateTime.UtcNow
        };

        var created = await _reviewRepository.AddAsync(review);
        return MapToDto(created);
    }

    public async Task<bool> DeleteReviewAsync(int id, Guid currentUserId, string currentUserRole)
    {
        var review = await _reviewRepository.GetByIdAsync(id);
        if (review == null) return false;

        if (currentUserRole == "Operator")
        {
            throw new UnauthorizedAccessException("Operatorii nu au permisiunea să șteargă recenzii.");
        }

        if (review.Reservation?.UserId != currentUserId && currentUserRole != "Admin")
        {
            throw new UnauthorizedAccessException("Nu poți șterge recenzia altui utilizator.");
        }

        return await _reviewRepository.DeleteAsync(id);
    }

    private static ReviewDto MapToDto(Review review)
    {
        return new ReviewDto
        {
            Id = review.Id,
            Rating = review.Rating,
            Comment = review.Comment,
            ReservationId = review.ReservationId,
            CreatedAt = review.CreatedAt
        };
    }
}

