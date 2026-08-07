using System.Text;
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

        if (currentUserRole == RBooking.Domain.Enums.UserRole.Client)
        {
            if (reservation.UserId != currentUserId)
            {
                throw new UnauthorizedAccessException("Nu poți șterge rezervarea altui utilizator.");
            }
        }
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

    public async Task<(byte[] FileContent, string ContentType, string FileName)> GenerateReportAsync(ReservationReportRequestDto request)
    {
        var reservations = await _reservationRepository.GetAllAsync();

        var filtered = reservations.Where(r =>
        {
            var f = request.Filters;
            if (f == null) return true;

            if (!string.IsNullOrEmpty(f.UserEmail) && !(r.User?.Email?.Contains(f.UserEmail, StringComparison.OrdinalIgnoreCase) ?? false)) return false;
            if (!string.IsNullOrEmpty(f.AccommodationName) && !(r.Accommodation?.Name?.Contains(f.AccommodationName, StringComparison.OrdinalIgnoreCase) ?? false)) return false;
            if (!string.IsNullOrEmpty(f.City) && !(r.Accommodation?.City?.Equals(f.City, StringComparison.OrdinalIgnoreCase) ?? false)) return false;
            if (!string.IsNullOrEmpty(f.Country) && !(r.Accommodation?.Country?.Equals(f.Country, StringComparison.OrdinalIgnoreCase) ?? false)) return false;
            if (f.NumberOfGuests.HasValue && r.NumberOfGuests != f.NumberOfGuests.Value) return false;
            if (f.MinPrice.HasValue && r.TotalPrice < f.MinPrice.Value) return false;
            if (f.MaxPrice.HasValue && r.TotalPrice > f.MaxPrice.Value) return false;
            if (!string.IsNullOrEmpty(f.Status) && Enum.TryParse<ReservationStatus>(f.Status, true, out var parsedStatus) && r.Status != parsedStatus) return false;

            return true;
        }).ToList();

        var columns = (request.Columns == null || !request.Columns.Any())
            ? new List<string> { "Id", "UserEmail", "AccommodationName", "City", "CheckInDate", "CheckOutDate", "TotalPrice", "Status" }
            : request.Columns;

        var sb = new StringBuilder();
        sb.AppendLine(string.Join(",", columns));

        foreach (var r in filtered)
        {
            var values = new List<string>();
            foreach (var col in columns)
            {
                string val = col switch
                {
                    "Id" => r.Id.ToString(),
                    "UserId" => r.UserId.ToString(),
                    "UserEmail" => r.User?.Email ?? "N/A",
                    "AccommodationId" => r.AccommodationId.ToString(),
                    "AccommodationName" => r.Accommodation?.Name ?? "N/A",
                    "City" => r.Accommodation?.City ?? "N/A",
                    "Country" => r.Accommodation?.Country ?? "N/A",
                    "CheckInDate" => r.CheckInDate.ToString("yyyy-MM-dd"),
                    "CheckOutDate" => r.CheckOutDate.ToString("yyyy-MM-dd"),
                    "NumberOfGuests" => r.NumberOfGuests.ToString(),
                    "TotalPrice" => r.TotalPrice.ToString(),
                    "Status" => r.Status.ToString(),
                    "CreatedAt" => r.CreatedAt.ToString("yyyy-MM-dd HH:mm"),
                    _ => string.Empty
                };
                values.Add($"\"{val}\"");
            }
            sb.AppendLine(string.Join(",", values));
        }

        var bytes = Encoding.UTF8.GetBytes(sb.ToString());
        return (bytes, "text/csv", $"ReservationsReport_{DateTime.UtcNow:yyyyMMdd}.csv");
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