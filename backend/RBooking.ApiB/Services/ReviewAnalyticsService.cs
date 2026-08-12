using System.Collections.Concurrent;
using Microsoft.Extensions.Logging;
using RBooking.ApiB.DTOs;

namespace RBooking.ApiB.Services;

public class ReviewAnalyticsService : IReviewAnalyticsService
{
    private readonly IApiAClient _apiAClient;
    private readonly ILogger<ReviewAnalyticsService> _logger;

    private static readonly ConcurrentDictionary<Guid, AccommodationAnalyticsResultDto> LatestByAccommodation = new();
    private static readonly ConcurrentQueue<AccommodationAnalyticsResultDto> History = new();

    public ReviewAnalyticsService(
        IApiAClient apiAClient,
        ILogger<ReviewAnalyticsService> logger)
    {
        _apiAClient = apiAClient;
        _logger = logger;
    }

    public async Task<AccommodationAnalyticsResultDto> ProcessReviewCreatedWebhookAsync(Guid reservationId, int? reviewId)
    {
        _logger.LogInformation(
            "[AnalyticsService] Processing review webhook for ReservationId: {ReservationId}, ReviewId: {ReviewId}",
            reservationId, reviewId);

        // Pasul 1: Aflăm AccommodationId prin request B => A pe baza ReservationId
        var reservation = await _apiAClient.GetReservationByIdAsync(reservationId);
        if (reservation == null)
        {
            _logger.LogWarning("[AnalyticsService] Reservation {ReservationId} was not found in API A.", reservationId);
            throw new KeyNotFoundException($"Rezervarea cu ID {reservationId} nu a fost găsită în API A.");
        }

        var accommodationId = reservation.AccommodationId;
        var accommodationName = reservation.AccommodationName;

        _logger.LogInformation(
            "[AnalyticsService] Resolved AccommodationId {AccommodationId} ({AccommodationName}) from ReservationId {ReservationId}",
            accommodationId, accommodationName, reservationId);

        // Pasul 2: Cerem în batch-uri toate rezervările cazării respective de la API A
        const int batchSize = 10;
        var allReservations = new List<ApiAReservationDto>();
        int pageNumber = 1;
        int totalBatches = 0;

        while (true)
        {
            totalBatches++;
            var batchResult = await _apiAClient.GetReservationsByAccommodationPagedAsync(accommodationId, pageNumber, batchSize);

            if (batchResult == null || !batchResult.Items.Any())
            {
                break;
            }

            allReservations.AddRange(batchResult.Items);

            _logger.LogInformation(
                "[AnalyticsService] Batch {BatchNumber}: Retrieved {Count} reservations (Total so far: {Total}/{TotalCount})",
                pageNumber, batchResult.Items.Count(), allReservations.Count, batchResult.TotalCount);

            if (!batchResult.HasNextPage || allReservations.Count >= batchResult.TotalCount)
            {
                break;
            }

            pageNumber++;
        }

        // Pasul 3: Calculăm average-urile și statisticile agregate
        int totalReservations = allReservations.Count;
        decimal averageTotalPrice = totalReservations > 0 ? allReservations.Average(r => r.TotalPrice) : 0m;
        double averageGuests = totalReservations > 0 ? allReservations.Average(r => r.NumberOfGuests) : 0.0;
        double averageNights = totalReservations > 0
            ? allReservations.Average(r => Math.Max(1, (r.CheckOutDate.Date - r.CheckInDate.Date).Days))
            : 0.0;
        decimal totalRevenue = allReservations.Sum(r => r.TotalPrice);

        var analyticsResult = new AccommodationAnalyticsResultDto
        {
            AccommodationId = accommodationId,
            AccommodationName = accommodationName,
            TotalReservations = totalReservations,
            AverageTotalPrice = Math.Round(averageTotalPrice, 2),
            AverageNumberOfGuests = Math.Round(averageGuests, 2),
            AverageStayNights = Math.Round(averageNights, 2),
            TotalRevenue = Math.Round(totalRevenue, 2),
            ProcessedBatchesCount = totalBatches,
            BatchSize = batchSize,
            CalculatedAt = DateTime.UtcNow,
            TriggeredByReviewId = reviewId,
            TriggeredByReservationId = reservationId
        };

        LatestByAccommodation[accommodationId] = analyticsResult;
        History.Enqueue(analyticsResult);

        _logger.LogInformation(
            "[AnalyticsService] Successfully calculated analytics for Accommodation {AccommodationId} ({Name}): TotalReservations: {Total}, AvgPrice: {AvgPrice}, AvgGuests: {AvgGuests}, TotalRevenue: {TotalRevenue}",
            accommodationId, accommodationName, totalReservations, analyticsResult.AverageTotalPrice, analyticsResult.AverageNumberOfGuests, analyticsResult.TotalRevenue);

        return analyticsResult;
    }

    public AccommodationAnalyticsResultDto? GetLatestAnalytics(Guid accommodationId)
    {
        LatestByAccommodation.TryGetValue(accommodationId, out var result);
        return result;
    }

    public IReadOnlyList<AccommodationAnalyticsResultDto> GetAllAnalyticsHistory()
    {
        return History.ToList();
    }
}
