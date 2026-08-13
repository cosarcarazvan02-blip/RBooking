using Microsoft.Extensions.Configuration;
using Moq;
using RBooking.Application.DTOs;
using RBooking.Application.Interfaces;
using RBooking.Application.Services;
using RBooking.Domain.Entities;
using RBooking.Domain.Enums;
using Xunit;

namespace RBooking.Tests;

public class ReservationServiceTests
{
    private readonly Mock<IReservationRepository> _reservationRepositoryMock;
    private readonly Mock<IUserRepository> _userRepositoryMock;
    private readonly Mock<IAccommodationRepository> _accommodationRepositoryMock;
    private readonly Mock<IEmailSender> _emailSenderMock;
    private readonly Mock<IConfiguration> _configurationMock;
    private readonly Mock<IWebhookSender> _webhookSenderMock;
    private readonly ReservationService _reservationService;

    public ReservationServiceTests()
    {
        _reservationRepositoryMock = new Mock<IReservationRepository>();
        _userRepositoryMock = new Mock<IUserRepository>();
        _accommodationRepositoryMock = new Mock<IAccommodationRepository>();
        _emailSenderMock = new Mock<IEmailSender>();
        _configurationMock = new Mock<IConfiguration>();
        _configurationMock.Setup(c => c["Platform:CommissionRate"]).Returns("0.10");
        _webhookSenderMock = new Mock<IWebhookSender>();

        _reservationService = new ReservationService(
            _reservationRepositoryMock.Object,
            _userRepositoryMock.Object,
            _accommodationRepositoryMock.Object,
            _emailSenderMock.Object,
            _configurationMock.Object,
            _webhookSenderMock.Object);
    }

    [Fact]
    public async Task GetAllReservationsAsync_ReturnsMappedDtos()
    {
        // Arrange
        var userId = Guid.NewGuid();
        var accommodationId = Guid.NewGuid();
        var reservations = new List<Reservation>
        {
            new Reservation
            {
                Id = Guid.NewGuid(),
                UserId = userId,
                User = new User { Id = userId, Email = "guest@example.com" },
                AccommodationId = accommodationId,
                Accommodation = new Hotel { Id = accommodationId, Name = "Grand Hotel" },
                CheckInDate = DateTime.UtcNow.AddDays(1),
                CheckOutDate = DateTime.UtcNow.AddDays(3),
                NumberOfGuests = 2,
                TotalPrice = 200m,
                Status = ReservationStatus.Pending
            }
        };

        _reservationRepositoryMock.Setup(r => r.GetAllAsync()).ReturnsAsync(reservations);

        // Act
        var result = await _reservationService.GetAllReservationsAsync();

        // Assert
        Assert.NotNull(result);
        var list = result.ToList();
        Assert.Single(list);
        Assert.Equal("guest@example.com", list[0].UserEmail);
        Assert.Equal("Grand Hotel", list[0].AccommodationName);
    }

    [Fact]
    public async Task GetReservationByIdAsync_WhenFound_ReturnsReservationDto()
    {
        // Arrange
        var reservationId = Guid.NewGuid();
        var reservation = new Reservation
        {
            Id = reservationId,
            UserId = Guid.NewGuid(),
            AccommodationId = Guid.NewGuid(),
            TotalPrice = 150m,
            Status = ReservationStatus.Confirmed
        };

        _reservationRepositoryMock.Setup(r => r.GetByIdAsync(reservationId)).ReturnsAsync(reservation);

        // Act
        var result = await _reservationService.GetReservationByIdAsync(reservationId);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(reservationId, result.Id);
        Assert.Equal(ReservationStatus.Confirmed, result.Status);
    }

    [Fact]
    public async Task GetReservationByIdAsync_WhenNotFound_ReturnsNull()
    {
        // Arrange
        var reservationId = Guid.NewGuid();
        _reservationRepositoryMock.Setup(r => r.GetByIdAsync(reservationId)).ReturnsAsync((Reservation?)null);

        // Act
        var result = await _reservationService.GetReservationByIdAsync(reservationId);

        // Assert
        Assert.Null(result);
    }

    [Fact]
    public async Task CreateReservationAsync_ValidData_CreatesReservationAndReturnsDto()
    {
        // Arrange
        var userId = Guid.NewGuid();
        var accommodationId = Guid.NewGuid();

        var user = new User { Id = userId, Email = "user@booking.com", FirstName = "John", LastName = "Doe" };
        var accommodation = new Hotel { Id = accommodationId, Name = "Beach Resort", PricePerNight = 120m };

        var createDto = new CreateReservationDto
        {
            UserId = userId,
            AccommodationId = accommodationId,
            CheckInDate = DateTime.UtcNow.AddDays(2),
            CheckOutDate = DateTime.UtcNow.AddDays(5), // 3 nights
            NumberOfGuests = 2
        };

        _userRepositoryMock.Setup(r => r.GetByIdAsync(userId)).ReturnsAsync(user);
        _accommodationRepositoryMock.Setup(r => r.GetByIdAsync(accommodationId)).ReturnsAsync(accommodation);
        _reservationRepositoryMock.Setup(r => r.AddAsync(It.IsAny<Reservation>()))
            .ReturnsAsync((Reservation res) => res);

        // Act
        var result = await _reservationService.CreateReservationAsync(createDto);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(userId, result.UserId);
        Assert.Equal("user@booking.com", result.UserEmail);
        Assert.Equal(accommodationId, result.AccommodationId);
        Assert.Equal("Beach Resort", result.AccommodationName);
        Assert.Equal(360m, result.TotalPrice); // 3 nights * 120m
        Assert.Equal(ReservationStatus.Pending, result.Status);

        _reservationRepositoryMock.Verify(r => r.AddAsync(It.Is<Reservation>(res =>
            res.UserId == userId &&
            res.AccommodationId == accommodationId &&
            res.TotalPrice == 360m &&
            res.PlatformFeeRate == 0.10m &&
            res.PlatformFeeAmount == 36.00m &&
            res.OperatorPayoutAmount == 324.00m &&
            res.CheckInDate.Kind == DateTimeKind.Utc &&
            res.CheckOutDate.Kind == DateTimeKind.Utc
        )), Times.Once);
    }

    [Fact]
    public async Task CreateReservationAsync_CheckOutBeforeCheckIn_ThrowsArgumentException()
    {
        // Arrange
        var createDto = new CreateReservationDto
        {
            UserId = Guid.NewGuid(),
            AccommodationId = Guid.NewGuid(),
            CheckInDate = DateTime.UtcNow.AddDays(5),
            CheckOutDate = DateTime.UtcNow.AddDays(2),
            NumberOfGuests = 1
        };

        // Act & Assert
        var ex = await Assert.ThrowsAsync<ArgumentException>(() => _reservationService.CreateReservationAsync(createDto));
        Assert.Equal("Check-out date must be after check-in date.", ex.Message);
    }

    [Fact]
    public async Task CreateReservationAsync_NumberOfGuestsZero_ThrowsArgumentException()
    {
        // Arrange
        var createDto = new CreateReservationDto
        {
            UserId = Guid.NewGuid(),
            AccommodationId = Guid.NewGuid(),
            CheckInDate = DateTime.UtcNow.AddDays(1),
            CheckOutDate = DateTime.UtcNow.AddDays(3),
            NumberOfGuests = 0
        };

        // Act & Assert
        var ex = await Assert.ThrowsAsync<ArgumentException>(() => _reservationService.CreateReservationAsync(createDto));
        Assert.Equal("Number of guests must be at least 1.", ex.Message);
    }

    [Fact]
    public async Task CreateReservationAsync_UserNotFound_ThrowsArgumentException()
    {
        // Arrange
        var userId = Guid.NewGuid();
        var createDto = new CreateReservationDto
        {
            UserId = userId,
            AccommodationId = Guid.NewGuid(),
            CheckInDate = DateTime.UtcNow.AddDays(1),
            CheckOutDate = DateTime.UtcNow.AddDays(3),
            NumberOfGuests = 2
        };

        _userRepositoryMock.Setup(r => r.GetByIdAsync(userId)).ReturnsAsync((User?)null);

        // Act & Assert
        var ex = await Assert.ThrowsAsync<ArgumentException>(() => _reservationService.CreateReservationAsync(createDto));
        Assert.Contains($"User with ID {userId} was not found.", ex.Message);
    }

    [Fact]
    public async Task CreateReservationAsync_AccommodationNotFound_ThrowsArgumentException()
    {
        // Arrange
        var userId = Guid.NewGuid();
        var accommodationId = Guid.NewGuid();
        var user = new User { Id = userId, Email = "user@booking.com" };

        var createDto = new CreateReservationDto
        {
            UserId = userId,
            AccommodationId = accommodationId,
            CheckInDate = DateTime.UtcNow.AddDays(1),
            CheckOutDate = DateTime.UtcNow.AddDays(3),
            NumberOfGuests = 2
        };

        _userRepositoryMock.Setup(r => r.GetByIdAsync(userId)).ReturnsAsync(user);
        _accommodationRepositoryMock.Setup(r => r.GetByIdAsync(accommodationId)).ReturnsAsync((Accommodation?)null);

        // Act & Assert
        var ex = await Assert.ThrowsAsync<ArgumentException>(() => _reservationService.CreateReservationAsync(createDto));
        Assert.Contains($"Accommodation with ID {accommodationId} was not found.", ex.Message);
    }

    [Fact]
    public async Task UpdateReservationStatusAsync_WhenReservationExists_UpdatesAndReturnsDto()
    {
        // Arrange
        var reservationId = Guid.NewGuid();
        var reservation = new Reservation
        {
            Id = reservationId,
            Status = ReservationStatus.Pending
        };

        _reservationRepositoryMock.Setup(r => r.GetByIdAsync(reservationId)).ReturnsAsync(reservation);
        _reservationRepositoryMock.Setup(r => r.UpdateAsync(It.IsAny<Reservation>()))
            .ReturnsAsync((Reservation res) => res);

        // Act
        var result = await _reservationService.UpdateReservationStatusAsync(reservationId, ReservationStatus.Confirmed);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(ReservationStatus.Confirmed, result.Status);
        _reservationRepositoryMock.Verify(r => r.UpdateAsync(It.Is<Reservation>(res => res.Status == ReservationStatus.Confirmed)), Times.Once);
    }

    [Fact]
    public async Task CancelReservationAsync_WhenReservationExists_SetsStatusCancelledAndReturnsTrue()
    {
        // Arrange
        var reservationId = Guid.NewGuid();
        var reservation = new Reservation
        {
            Id = reservationId,
            Status = ReservationStatus.Confirmed
        };

        _reservationRepositoryMock.Setup(r => r.GetByIdAsync(reservationId)).ReturnsAsync(reservation);
        _reservationRepositoryMock.Setup(r => r.UpdateAsync(It.IsAny<Reservation>()))
            .ReturnsAsync((Reservation res) => res);

        // Act
        var result = await _reservationService.CancelReservationAsync(reservationId);

        // Assert
        Assert.True(result);
        _reservationRepositoryMock.Verify(r => r.UpdateAsync(It.Is<Reservation>(res => res.Status == ReservationStatus.Cancelled)), Times.Once);
    }

    [Fact]
    public async Task CreateReservationAsync_WhenActiveReservationExists_ThrowsInvalidOperationException()
    {
        // Arrange
        var userId = Guid.NewGuid();
        var accommodationId = Guid.NewGuid();

        var user = new User { Id = userId, Email = "user@booking.com", FirstName = "John", LastName = "Doe" };
        var accommodation = new Hotel { Id = accommodationId, Name = "Beach Resort", PricePerNight = 120m };

        var existingActive = new Reservation
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            AccommodationId = accommodationId,
            CheckInDate = DateTime.UtcNow.AddDays(-1),
            CheckOutDate = DateTime.UtcNow.AddDays(3),
            Status = ReservationStatus.Confirmed
        };

        var createDto = new CreateReservationDto
        {
            UserId = userId,
            AccommodationId = accommodationId,
            CheckInDate = DateTime.UtcNow.AddDays(5),
            CheckOutDate = DateTime.UtcNow.AddDays(8),
            NumberOfGuests = 2
        };

        _userRepositoryMock.Setup(r => r.GetByIdAsync(userId)).ReturnsAsync(user);
        _accommodationRepositoryMock.Setup(r => r.GetByIdAsync(accommodationId)).ReturnsAsync(accommodation);
        _reservationRepositoryMock.Setup(r => r.GetByUserIdAsync(userId)).ReturnsAsync(new List<Reservation> { existingActive });

        // Act & Assert
        var ex = await Assert.ThrowsAsync<InvalidOperationException>(() => _reservationService.CreateReservationAsync(createDto));
        Assert.Contains("Ai deja o rezervare activă", ex.Message);
        _reservationRepositoryMock.Verify(r => r.AddAsync(It.IsAny<Reservation>()), Times.Never);
    }

    [Fact]
    public async Task GetOperatorEarningsAsync_ClientRole_ThrowsUnauthorizedAccessException()
    {
        // Act & Assert
        await Assert.ThrowsAsync<UnauthorizedAccessException>(() =>
            _reservationService.GetOperatorEarningsAsync(Guid.NewGuid(), UserRole.Client, null, null, null));
        _accommodationRepositoryMock.Verify(r => r.GetAllAsync(), Times.Never);
    }

    [Fact]
    public async Task GetOperatorEarningsAsync_OperatorRequestsOtherOperatorsAccommodation_ThrowsUnauthorizedAccessException()
    {
        // Arrange
        var currentOperatorId = Guid.NewGuid();
        var otherOperatorAccommodationId = Guid.NewGuid();
        var otherAccommodation = new Hotel
        {
            Id = otherOperatorAccommodationId,
            Name = "Not Mine",
            OperatorId = Guid.NewGuid().ToString()
        };

        _accommodationRepositoryMock.Setup(r => r.GetAllAsync()).ReturnsAsync(new List<Accommodation> { otherAccommodation });

        // Act & Assert
        await Assert.ThrowsAsync<UnauthorizedAccessException>(() =>
            _reservationService.GetOperatorEarningsAsync(currentOperatorId, UserRole.Operator, null, null, otherOperatorAccommodationId));
    }

    [Fact]
    public async Task GetOperatorEarningsAsync_OperatorOwnAccommodations_SumsOnlyOwnReservations()
    {
        // Arrange
        var operatorId = Guid.NewGuid();
        var myAccommodationId = Guid.NewGuid();
        var otherOperatorAccommodationId = Guid.NewGuid();

        var myAccommodation = new Hotel { Id = myAccommodationId, Name = "Mine", OperatorId = operatorId.ToString() };
        var otherAccommodation = new Hotel { Id = otherOperatorAccommodationId, Name = "Not Mine", OperatorId = Guid.NewGuid().ToString() };

        var myReservation = new Reservation
        {
            Id = Guid.NewGuid(),
            AccommodationId = myAccommodationId,
            CheckInDate = DateTime.UtcNow.AddDays(1),
            Status = ReservationStatus.Confirmed,
            TotalPrice = 200m,
            PlatformFeeAmount = 20m,
            OperatorPayoutAmount = 180m
        };
        var otherReservation = new Reservation
        {
            Id = Guid.NewGuid(),
            AccommodationId = otherOperatorAccommodationId,
            CheckInDate = DateTime.UtcNow.AddDays(1),
            Status = ReservationStatus.Confirmed,
            TotalPrice = 999m,
            PlatformFeeAmount = 99.90m,
            OperatorPayoutAmount = 899.10m
        };
        var cancelledReservation = new Reservation
        {
            Id = Guid.NewGuid(),
            AccommodationId = myAccommodationId,
            CheckInDate = DateTime.UtcNow.AddDays(1),
            Status = ReservationStatus.Cancelled,
            TotalPrice = 500m,
            PlatformFeeAmount = 50m,
            OperatorPayoutAmount = 450m
        };

        _accommodationRepositoryMock.Setup(r => r.GetAllAsync())
            .ReturnsAsync(new List<Accommodation> { myAccommodation, otherAccommodation });
        _reservationRepositoryMock.Setup(r => r.GetAllAsync())
            .ReturnsAsync(new List<Reservation> { myReservation, otherReservation, cancelledReservation });

        // Act
        var result = await _reservationService.GetOperatorEarningsAsync(operatorId, UserRole.Operator, null, null, null);

        // Assert - doar rezervarea proprie, ne-anulată, e inclusă
        Assert.Equal(200m, result.TotalCollected);
        Assert.Equal(20m, result.TotalCommission);
        Assert.Equal(180m, result.TotalNet);
        Assert.Equal(1, result.ReservationsCount);
    }
}
