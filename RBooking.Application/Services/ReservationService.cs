using RBooking.Application.DTOs;
using RBooking.Application.Interfaces;
using RBooking.Domain.Entities;
using RBooking.Domain.Enums;

namespace RBooking.Application.Services;

public class ReservationService : IReservationService
{
    private readonly IReservationRepository _reservationRepository;
    private readonly IUserRepository _userRepository;
    private readonly IAccommodationRepository _accommodationRepository;

    public ReservationService(
        IReservationRepository reservationRepository,
        IUserRepository userRepository,
        IAccommodationRepository accommodationRepository)
    {
        _reservationRepository = reservationRepository;
        _userRepository = userRepository;
        _accommodationRepository = accommodationRepository;
    }

    public async Task<IEnumerable<ReservationDto>> GetAllReservationsAsync()
    {
        var reservations = await _reservationRepository.GetAllAsync();
        return reservations.Select(MapToDto);
    }

    public async Task<PagedResultDto<ReservationDto>> GetPagedReservationsAsync(PaginationParamsDto paginationParams)
    {
        var (items, totalCount) = await _reservationRepository.GetPagedAsync(paginationParams.PageNumber, paginationParams.PageSize);
        var dtos = items.Select(MapToDto);
        return new PagedResultDto<ReservationDto>(dtos, totalCount, paginationParams.PageNumber, paginationParams.PageSize);
    }

    public async Task<ReservationDto?> GetReservationByIdAsync(Guid id)
    {
        var reservation = await _reservationRepository.GetByIdAsync(id);
        return reservation == null ? null : MapToDto(reservation);
    }

    public async Task<IEnumerable<ReservationDto>> GetReservationsByUserIdAsync(Guid userId)
    {
        var reservations = await _reservationRepository.GetByUserIdAsync(userId);
        return reservations.Select(MapToDto);
    }

    public async Task<PagedResultDto<ReservationDto>> GetPagedReservationsByUserIdAsync(Guid userId, PaginationParamsDto paginationParams)
    {
        var (items, totalCount) = await _reservationRepository.GetPagedByUserIdAsync(userId, paginationParams.PageNumber, paginationParams.PageSize);
        var dtos = items.Select(MapToDto);
        return new PagedResultDto<ReservationDto>(dtos, totalCount, paginationParams.PageNumber, paginationParams.PageSize);
    }

    public async Task<ReservationDto> CreateReservationAsync(CreateReservationDto createReservationDto)
    {
        if (createReservationDto.CheckOutDate <= createReservationDto.CheckInDate)
        {
            throw new ArgumentException("Check-out date must be after check-in date.");
        }

        if (createReservationDto.NumberOfGuests <= 0)
        {
            throw new ArgumentException("Number of guests must be at least 1.");
        }

        var user = await _userRepository.GetByIdAsync(createReservationDto.UserId);
        if (user == null)
        {
            throw new ArgumentException($"User with ID {createReservationDto.UserId} was not found.");
        }

        var accommodation = await _accommodationRepository.GetByIdAsync(createReservationDto.AccommodationId);
        if (accommodation == null)
        {
            throw new ArgumentException($"Accommodation with ID {createReservationDto.AccommodationId} was not found.");
        }

        var checkInUtc = createReservationDto.CheckInDate.Kind == DateTimeKind.Unspecified
            ? DateTime.SpecifyKind(createReservationDto.CheckInDate, DateTimeKind.Utc)
            : createReservationDto.CheckInDate.ToUniversalTime();

        var checkOutUtc = createReservationDto.CheckOutDate.Kind == DateTimeKind.Unspecified
            ? DateTime.SpecifyKind(createReservationDto.CheckOutDate, DateTimeKind.Utc)
            : createReservationDto.CheckOutDate.ToUniversalTime();

        int nights = (checkOutUtc.Date - checkInUtc.Date).Days;
        if (nights <= 0) nights = 1;

        decimal basePricePerNight = accommodation.PricePerNight > 0 ? accommodation.PricePerNight : 100m;
        decimal totalPrice = nights * basePricePerNight;

        var reservation = new Reservation
        {
            Id = Guid.NewGuid(),
            UserId = createReservationDto.UserId,
            User = user,
            AccommodationId = createReservationDto.AccommodationId,
            Accommodation = accommodation,
            CheckInDate = checkInUtc,
            CheckOutDate = checkOutUtc,
            NumberOfGuests = createReservationDto.NumberOfGuests,
            TotalPrice = totalPrice,
            Status = ReservationStatus.Pending,
            CreatedAt = DateTime.UtcNow
        };

        var created = await _reservationRepository.AddAsync(reservation);
        return MapToDto(created);
    }

    public async Task<ReservationDto?> UpdateReservationStatusAsync(Guid id, ReservationStatus newStatus)
    {
        var reservation = await _reservationRepository.GetByIdAsync(id);
        if (reservation == null) return null;

        reservation.Status = newStatus;
        var updated = await _reservationRepository.UpdateAsync(reservation);
        return updated == null ? null : MapToDto(updated);
    }

    public async Task<bool> CancelReservationAsync(Guid id)
    {
        var reservation = await _reservationRepository.GetByIdAsync(id);
        if (reservation == null) return false;

        reservation.Status = ReservationStatus.Cancelled;
        var updated = await _reservationRepository.UpdateAsync(reservation);
        return updated != null;
    }

    public async Task<bool> DeleteReservationAsync(Guid id, Guid currentUserId, RBooking.Domain.Enums.UserRole currentUserRole)
    {
        var reservation = await _reservationRepository.GetByIdAsync(id);
        if (reservation == null) return false;

        // Dacă e Client, poate șterge doar propria rezervare
        if (currentUserRole == RBooking.Domain.Enums.UserRole.Client)
        {
            if (reservation.UserId != currentUserId)
            {
                throw new UnauthorizedAccessException("Nu poți șterge rezervarea altui utilizator.");
            }
        }
        // Dacă e Operator, poate șterge doar dacă hotelul îi aparține
        else if (currentUserRole == RBooking.Domain.Enums.UserRole.Operator)
        {
            var accommodation = await _accommodationRepository.GetByIdAsync(reservation.AccommodationId);
            if (accommodation == null || accommodation.OperatorId != currentUserId.ToString())
            {
                throw new UnauthorizedAccessException("Poți șterge rezervări doar pentru propriile hoteluri.");
            }
        }

        return await _reservationRepository.DeleteAsync(id);
    }

    private static ReservationDto MapToDto(Reservation reservation)
    {
        return new ReservationDto
        {
            Id = reservation.Id,
            UserId = reservation.UserId,
            UserEmail = reservation.User?.Email ?? string.Empty,
            AccommodationId = reservation.AccommodationId,
            AccommodationName = reservation.Accommodation?.Name ?? string.Empty,
            CheckInDate = reservation.CheckInDate,
            CheckOutDate = reservation.CheckOutDate,
            NumberOfGuests = reservation.NumberOfGuests,
            TotalPrice = reservation.TotalPrice,
            Status = reservation.Status,
            CreatedAt = reservation.CreatedAt
        };
    }
}
