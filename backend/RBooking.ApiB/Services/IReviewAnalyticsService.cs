using RBooking.ApiB.DTOs;

namespace RBooking.ApiB.Services;

public interface IReviewAnalyticsService
{
    Task<AccommodationAnalyticsResultDto> ProcessReviewCreatedWebhookAsync(Guid reservationId, int? reviewId);
    AccommodationAnalyticsResultDto? GetLatestAnalytics(Guid accommodationId);
    IReadOnlyList<AccommodationAnalyticsResultDto> GetAllAnalyticsHistory();
}
