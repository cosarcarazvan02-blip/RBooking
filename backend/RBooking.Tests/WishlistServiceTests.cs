using Moq;
using RBooking.Application.DTOs;
using RBooking.Application.Interfaces;
using RBooking.Application.Services;
using RBooking.Domain.Entities;
using Xunit;

namespace RBooking.Tests;

public class WishlistServiceTests
{
    private readonly Mock<IWishlistRepository> _mockWishlistRepo;
    private readonly Mock<IAccommodationRepository> _mockAccRepo;
    private readonly WishlistService _service;

    public WishlistServiceTests()
    {
        _mockWishlistRepo = new Mock<IWishlistRepository>();
        _mockAccRepo = new Mock<IAccommodationRepository>();
        _service = new WishlistService(_mockWishlistRepo.Object, _mockAccRepo.Object);
    }

    [Fact]
    public async Task GetUserWishlistAsync_ReturnsMappedDtos()
    {
        // Arrange
        var userId = Guid.NewGuid();
        var accId = Guid.NewGuid();
        var items = new List<WishlistItem>
        {
            new WishlistItem
            {
                Id = Guid.NewGuid(),
                UserId = userId,
                AccommodationId = accId,
                Accommodation = new Hotel { Id = accId, Name = "Grand Hotel", City = "Bucharest", PricePerNight = 300 }
            }
        };

        _mockWishlistRepo.Setup(r => r.GetByUserIdAsync(userId)).ReturnsAsync(items);
        _mockAccRepo.Setup(r => r.GetRatingStatsAsync(accId)).ReturnsAsync((4.8, 12));

        // Act
        var result = (await _service.GetUserWishlistAsync(userId)).ToList();

        // Assert
        Assert.Single(result);
        Assert.Equal("Grand Hotel", result[0].AccommodationName);
        Assert.Equal(4.8, result[0].AverageRating);
        Assert.Equal(300, result[0].PricePerNight);
    }

    [Fact]
    public async Task AddToWishlistAsync_WhenAccommodationExists_AddsAndReturnsDto()
    {
        // Arrange
        var userId = Guid.NewGuid();
        var accId = Guid.NewGuid();
        var hotel = new Hotel { Id = accId, Name = "Grand Hotel", PricePerNight = 300 };

        _mockAccRepo.Setup(r => r.GetByIdAsync(accId)).ReturnsAsync(hotel);
        _mockWishlistRepo.Setup(r => r.GetByUserAndAccommodationAsync(userId, accId)).ReturnsAsync((WishlistItem?)null);
        _mockWishlistRepo.Setup(r => r.AddAsync(It.IsAny<WishlistItem>()))
            .ReturnsAsync((WishlistItem item) => item);
        _mockAccRepo.Setup(r => r.GetRatingStatsAsync(accId)).ReturnsAsync((4.5, 10));

        // Act
        var result = await _service.AddToWishlistAsync(userId, accId);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(accId, result.AccommodationId);
        Assert.Equal(userId, result.UserId);
        _mockWishlistRepo.Verify(r => r.AddAsync(It.IsAny<WishlistItem>()), Times.Once);
    }

    [Fact]
    public async Task AddToWishlistAsync_WhenAccommodationNotFound_ThrowsArgumentException()
    {
        // Arrange
        var userId = Guid.NewGuid();
        var accId = Guid.NewGuid();
        _mockAccRepo.Setup(r => r.GetByIdAsync(accId)).ReturnsAsync((Accommodation?)null);

        // Act & Assert
        await Assert.ThrowsAsync<ArgumentException>(() => _service.AddToWishlistAsync(userId, accId));
        _mockWishlistRepo.Verify(r => r.AddAsync(It.IsAny<WishlistItem>()), Times.Never);
    }

    [Fact]
    public async Task RemoveFromWishlistAsync_CallsRepositoryDelete()
    {
        // Arrange
        var userId = Guid.NewGuid();
        var accId = Guid.NewGuid();
        _mockWishlistRepo.Setup(r => r.DeleteAsync(userId, accId)).ReturnsAsync(true);

        // Act
        var result = await _service.RemoveFromWishlistAsync(userId, accId);

        // Assert
        Assert.True(result);
        _mockWishlistRepo.Verify(r => r.DeleteAsync(userId, accId), Times.Once);
    }

    [Fact]
    public async Task IsInWishlistAsync_ReturnsExpectedResult()
    {
        // Arrange
        var userId = Guid.NewGuid();
        var accId = Guid.NewGuid();
        _mockWishlistRepo.Setup(r => r.ExistsAsync(userId, accId)).ReturnsAsync(true);

        // Act
        var result = await _service.IsInWishlistAsync(userId, accId);

        // Assert
        Assert.True(result);
    }
}
