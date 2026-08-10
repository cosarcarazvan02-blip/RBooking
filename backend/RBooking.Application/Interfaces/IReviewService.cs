using RBooking.Application.DTOs;

namespace RBooking.Application.Interfaces;

public interface IReviewService
{
    Task<IEnumerable<ReviewDto>> GetReviewsByAccommodationIdAsync(Guid accommodationId);
    Task<ReviewDto> CreateReviewAsync(Guid currentUserId, CreateReviewDto createReviewDto);
    Task<bool> DeleteReviewAsync(int id, Guid currentUserId, string currentUserRole);
}