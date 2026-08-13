using RBooking.Application.DTOs;
using RBooking.Application.Interfaces;
using RBooking.Domain.Entities;
using RBooking.Domain.Enums;

namespace RBooking.Application.Services;

public class ReviewService : IReviewService
{
    private readonly IReviewRepository _reviewRepository;
    private readonly IReservationRepository _reservationRepository;
    private readonly IWebhookSenderService _webhookSenderService;

    public ReviewService(
        IReviewRepository reviewRepository,
        IReservationRepository reservationRepository,
        IWebhookSenderService webhookSenderService)
    {
        _reviewRepository = reviewRepository;
        _reservationRepository = reservationRepository;
        _webhookSenderService = webhookSenderService;
    }

    public async Task<IEnumerable<ReviewDto>> GetReviewsByAccommodationIdAsync(Guid accommodationId)
    {
        var reviews = await _reviewRepository.GetByAccommodationIdAsync(accommodationId);
        return reviews.Select(MapToDto);
    }

    public async Task<ReviewDto> CreateReviewAsync(Guid currentUserId, CreateReviewDto dto)
    {
        Reservation? reservation = null;

        if (dto.ReservationId.HasValue && dto.ReservationId.Value != Guid.Empty)
        {
            reservation = await _reservationRepository.GetByIdAsync(dto.ReservationId.Value);
            if (reservation != null && reservation.UserId != currentUserId)
            {
                throw new UnauthorizedAccessException("Nu poți adăuga o recenzie pentru rezervarea altui utilizator.");
            }
        }

        // Determinăm cazarea vizată
        Guid? targetAccommodationId = (dto.AccommodationId.HasValue && dto.AccommodationId.Value != Guid.Empty)
            ? dto.AccommodationId.Value
            : reservation?.AccommodationId;

        // Dacă nu s-a găsit după ID sau nu a fost specificat un ID valid, căutăm o rezervare fără recenzie a utilizatorului pentru cazarea respectivă
        if (reservation == null)
        {
            var userReservations = (await _reservationRepository.GetByUserIdAsync(currentUserId)).ToList();
            
            // Dacă s-a specificat cazarea, filtrăm strict rezervările pentru acea cazare
            if (targetAccommodationId.HasValue)
            {
                userReservations = userReservations.Where(r => r.AccommodationId == targetAccommodationId.Value).ToList();
                if (userReservations.Count == 0)
                {
                    throw new InvalidOperationException("Trebuie să ai cel puțin o rezervare la această cazare pentru a putea lăsa o recenzie.");
                }
            }
            else if (userReservations.Count == 0)
            {
                throw new InvalidOperationException("Trebuie să ai cel puțin o rezervare pentru a putea lăsa o recenzie.");
            }

            foreach (var res in userReservations)
            {
                var isReviewed = await _reviewRepository.HasReviewForReservationAsync(res.Id);
                if (!isReviewed)
                {
                    reservation = res;
                    break;
                }
            }

            if (reservation == null)
            {
                throw new InvalidOperationException("Ai adăugat deja o recenzie pentru această cazare. Fiecare utilizator poate adăuga o singură recenzie per cazare.");
            }
        }

        if (!targetAccommodationId.HasValue)
        {
            targetAccommodationId = reservation.AccommodationId;
        }

        // REGULA DE BAZĂ: 1 singură recenzie per utilizator per cazare
        if (targetAccommodationId.HasValue)
        {
            var existingReviewsForAcc = await _reviewRepository.GetByAccommodationIdAsync(targetAccommodationId.Value);
            var alreadyReviewedByThisUser = existingReviewsForAcc.Any(r => r.Reservation != null && r.Reservation.UserId == currentUserId);
            if (alreadyReviewedByThisUser)
            {
                throw new InvalidOperationException("Ai adăugat deja o recenzie pentru această cazare. Fiecare utilizator poate adăuga o singură recenzie per cazare.");
            }
        }

        // Verificăm dacă rezervarea selectată are deja recenzie
        var alreadyHasReview = await _reviewRepository.HasReviewForReservationAsync(reservation.Id);
        if (alreadyHasReview)
        {
            throw new InvalidOperationException("Există deja o recenzie asociată acestei rezervări. Fiecare utilizator poate adăuga o singură recenzie per cazare.");
        }

        var review = new Review
        {
            ReservationId = reservation.Id,
            Rating = dto.Rating < 1 ? 1 : (dto.Rating > 5 ? 5 : dto.Rating),
            Comment = dto.Comment,
            CreatedAt = DateTime.UtcNow
        };

        var created = await _reviewRepository.AddAsync(review);

        // Declanșează webhook asincron către API B
        _ = Task.Run(async () =>
        {
            try
            {
                await _webhookSenderService.SendReviewCreatedWebhookAsync(created.Id, created.ReservationId);
            }
            catch
            {
                // Ignorăm erorile de fundal pentru a nu afecta salvarea recenziei
            }
        });

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
            UserId = review.Reservation?.UserId,
            UserEmail = review.Reservation?.User?.Email,
            UserName = review.Reservation?.User != null 
                ? $"{review.Reservation.User.FirstName} {review.Reservation.User.LastName}".Trim() 
                : null,
            CreatedAt = review.CreatedAt
        };
    }
}
