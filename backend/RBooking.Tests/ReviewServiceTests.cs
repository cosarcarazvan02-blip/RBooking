using Moq;
using RBooking.Application.DTOs;
using RBooking.Application.Interfaces;
using RBooking.Application.Services;
using RBooking.Domain.Entities;
using RBooking.Domain.Enums;
using Xunit;

namespace RBooking.Tests;

public class ReviewServiceTests
{
    private readonly Mock<IReviewRepository> _reviewRepoMock;
    private readonly Mock<IReservationRepository> _reservationRepoMock;
    private readonly Mock<IWebhookSenderService> _webhookSenderMock;
    private readonly ReviewService _sut;

    public ReviewServiceTests()
    {
        _reviewRepoMock = new Mock<IReviewRepository>();
        _reservationRepoMock = new Mock<IReservationRepository>();
        _webhookSenderMock = new Mock<IWebhookSenderService>();

        _sut = new ReviewService(
            _reviewRepoMock.Object,
            _reservationRepoMock.Object,
            _webhookSenderMock.Object);
    }

    [Fact]
    public async Task CreateReviewAsync_WhenReservationHasNoReview_CreatesReviewSuccessfully()
    {
        // Arrange
        var userId = Guid.NewGuid();
        var reservationId = Guid.NewGuid();
        var reservation = new Reservation
        {
            Id = reservationId,
            UserId = userId,
            AccommodationId = Guid.NewGuid(),
            Status = ReservationStatus.Confirmed
        };

        var dto = new CreateReviewDto
        {
            ReservationId = reservationId,
            Rating = 5,
            Comment = "Servicii excelente!"
        };

        _reservationRepoMock.Setup(r => r.GetByIdAsync(reservationId))
            .ReturnsAsync(reservation);
        _reviewRepoMock.Setup(r => r.HasReviewForReservationAsync(reservationId))
            .ReturnsAsync(false);
        _reviewRepoMock.Setup(r => r.AddAsync(It.IsAny<Review>()))
            .ReturnsAsync((Review rev) =>
            {
                rev.Id = 10;
                return rev;
            });

        // Act
        var result = await _sut.CreateReviewAsync(userId, dto);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(10, result.Id);
        Assert.Equal(5, result.Rating);
        Assert.Equal("Servicii excelente!", result.Comment);
        Assert.Equal(reservationId, result.ReservationId);
        _reviewRepoMock.Verify(r => r.AddAsync(It.Is<Review>(x => x.ReservationId == reservationId && x.Rating == 5)), Times.Once);
    }

    [Fact]
    public async Task CreateReviewAsync_WhenReservationAlreadyHasReview_ThrowsInvalidOperationException()
    {
        // Arrange
        var userId = Guid.NewGuid();
        var reservationId = Guid.NewGuid();
        var reservation = new Reservation
        {
            Id = reservationId,
            UserId = userId,
            AccommodationId = Guid.NewGuid()
        };

        var dto = new CreateReviewDto
        {
            ReservationId = reservationId,
            Rating = 4,
            Comment = "Al doilea review nu ar trebui sa fie permis."
        };

        _reservationRepoMock.Setup(r => r.GetByIdAsync(reservationId))
            .ReturnsAsync(reservation);
        _reviewRepoMock.Setup(r => r.HasReviewForReservationAsync(reservationId))
            .ReturnsAsync(true);

        // Act & Assert
        var ex = await Assert.ThrowsAsync<InvalidOperationException>(() => _sut.CreateReviewAsync(userId, dto));
        Assert.Contains("Există deja o recenzie", ex.Message);
        _reviewRepoMock.Verify(r => r.AddAsync(It.IsAny<Review>()), Times.Never);
    }

    [Fact]
    public async Task CreateReviewAsync_WhenUserAttemptsToReviewAnotherUsersReservation_ThrowsUnauthorizedAccessException()
    {
        // Arrange
        var currentUserId = Guid.NewGuid();
        var otherUserId = Guid.NewGuid();
        var reservationId = Guid.NewGuid();
        var reservation = new Reservation
        {
            Id = reservationId,
            UserId = otherUserId,
            AccommodationId = Guid.NewGuid()
        };

        var dto = new CreateReviewDto
        {
            ReservationId = reservationId,
            Rating = 5,
            Comment = "Incercare ilegala"
        };

        _reservationRepoMock.Setup(r => r.GetByIdAsync(reservationId))
            .ReturnsAsync(reservation);

        // Act & Assert
        await Assert.ThrowsAsync<UnauthorizedAccessException>(() => _sut.CreateReviewAsync(currentUserId, dto));
        _reviewRepoMock.Verify(r => r.AddAsync(It.IsAny<Review>()), Times.Never);
    }

    [Fact]
    public async Task CreateReviewAsync_WhenNoReservationIdProvided_AndAllUserReservationsAlreadyReviewed_ThrowsInvalidOperationException()
    {
        // Arrange
        var userId = Guid.NewGuid();
        var res1 = new Reservation { Id = Guid.NewGuid(), UserId = userId };
        var res2 = new Reservation { Id = Guid.NewGuid(), UserId = userId };

        var dto = new CreateReviewDto
        {
            ReservationId = Guid.Empty,
            Rating = 5,
            Comment = "Fara id explicit"
        };

        _reservationRepoMock.Setup(r => r.GetByUserIdAsync(userId))
            .ReturnsAsync(new List<Reservation> { res1, res2 });
        _reviewRepoMock.Setup(r => r.HasReviewForReservationAsync(It.IsAny<Guid>()))
            .ReturnsAsync(true);

        // Act & Assert
        var ex = await Assert.ThrowsAsync<InvalidOperationException>(() => _sut.CreateReviewAsync(userId, dto));
        Assert.Contains("Ai adăugat deja o recenzie pentru toate rezervările tale", ex.Message);
        _reviewRepoMock.Verify(r => r.AddAsync(It.IsAny<Review>()), Times.Never);
    }

    [Fact]
    public async Task CreateReviewAsync_WhenUserHasNoReservationForSpecifiedAccommodation_ThrowsInvalidOperationException()
    {
        // Arrange
        var userId = Guid.NewGuid();
        var accId = Guid.NewGuid();
        var differentAccId = Guid.NewGuid();
        var resOther = new Reservation { Id = Guid.NewGuid(), UserId = userId, AccommodationId = differentAccId };

        var dto = new CreateReviewDto
        {
            AccommodationId = accId,
            Rating = 5,
            Comment = "Cazare gresita"
        };

        _reservationRepoMock.Setup(r => r.GetByUserIdAsync(userId))
            .ReturnsAsync(new List<Reservation> { resOther });

        // Act & Assert
        var ex = await Assert.ThrowsAsync<InvalidOperationException>(() => _sut.CreateReviewAsync(userId, dto));
        Assert.Contains("Trebuie să ai cel puțin o rezervare la această cazare", ex.Message);
        _reviewRepoMock.Verify(r => r.AddAsync(It.IsAny<Review>()), Times.Never);
    }
}
