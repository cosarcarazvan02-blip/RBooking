using Moq;
using RBooking.Application.Interfaces;
using RBooking.Application.Services;
using RBooking.Domain.Entities;
using Xunit;

public class DiscountServiceTests
{
    [Fact]
    public async Task GetByIdAsync_ShouldReturnDiscountDto_WhenDiscountExists()
    {
        var mockRepo = new Mock<IDiscountRepository>();
        
        var discountId = 1;
        var discountEntity = new PercentageDiscount
        {
            Id = discountId,
            Code = "SUMMER2026",
            Percentage = 20,
            StartingDate = DateTime.UtcNow.AddDays(-5),
            ExpirationDate = DateTime.UtcNow.AddDays(5)
        };

        mockRepo.Setup(repo => repo.GetByIdAsync(discountId))
                .ReturnsAsync(discountEntity);

        var service = new DiscountService(mockRepo.Object);

        var result = await service.GetByIdAsync(discountId);

        Assert.NotNull(result);
        Assert.Equal(discountId, result.Id);
        Assert.Equal("SUMMER2026", result.Code);
        Assert.True(result.IsActive);

        mockRepo.Verify(repo => repo.GetByIdAsync(discountId), Times.Once);
    }

    [Fact]
    public async Task GetByIdAsync_ShouldReturnNull_WhenDiscountDoesNotExist()
    {
        var mockRepo = new Mock<IDiscountRepository>();
        int nonExistentId = 99;

        mockRepo.Setup(repo => repo.GetByIdAsync(nonExistentId))
                .ReturnsAsync((Discount?)null);

        var service = new DiscountService(mockRepo.Object);

        var result = await service.GetByIdAsync(nonExistentId);

        Assert.Null(result);
        mockRepo.Verify(repo => repo.GetByIdAsync(nonExistentId), Times.Once);
    }

    [Fact]
    public async Task DeleteAsync_ShouldReturnTrue_WhenDiscountExists()
    {
        // Arrange
        var mockRepo = new Mock<IDiscountRepository>();
        var discountId = 1;

        var discountEntity = new AbsoluteValueDiscount
        {
            Id = discountId,
            Code = "PROMO10",
            Amount = 50
        };

        mockRepo.Setup(repo => repo.GetByIdAsync(discountId))
                .ReturnsAsync(discountEntity);
        
        mockRepo.Setup(repo => repo.DeleteAsync(discountId))
                .Returns(Task.CompletedTask);

        var service = new DiscountService(mockRepo.Object);

        // Act
        var success = await service.DeleteAsync(discountId);

        // Assert
        Assert.True(success);
        mockRepo.Verify(repo => repo.GetByIdAsync(discountId), Times.Once);
        mockRepo.Verify(repo => repo.DeleteAsync(discountId), Times.Once);
    }
}