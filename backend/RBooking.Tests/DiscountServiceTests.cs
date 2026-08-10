using Xunit;
using Moq;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using RBooking.Application.Services;
using RBooking.Application.DTOs;
using RBooking.Infrastructure.Repositories;
using RBooking.Domain.Entities;
using RBooking.Domain.Enums;
using RBooking.Application.Interfaces;

namespace RBooking.Tests
{
    public class DiscountServiceTests
    {
        [Fact]
        public async Task GetAllAsync_ShouldReturnDiscountDtos()
        {
            // Arrange
            var mockRepo = new Mock<IDiscountRepository>();
            var discounts = new List<Discount>
            {
                new AbsoluteValueDiscount { Id = 1, Code = "DISC1", Amount = 10, StartingDate = DateTime.UtcNow.AddDays(-1), ExpirationDate = DateTime.UtcNow.AddDays(1) }
            };
            mockRepo.Setup(r => r.GetAllAsync()).ReturnsAsync(discounts);

            var service = new DiscountService(mockRepo.Object);

            // Act
            var result = await service.GetAllAsync();

            // Assert
            Assert.NotNull(result);
            var list = result.ToList();
            Assert.Single(list);
            Assert.Equal("DISC1", list[0].Code);
            Assert.True(list[0].IsActive);
        }

        [Fact]
        public async Task GetByIdAsync_ShouldReturnNull_WhenNotFound()
        {
            // Arrange
            var mockRepo = new Mock<IDiscountRepository>();
            mockRepo.Setup(r => r.GetByIdAsync(It.IsAny<int>())).ReturnsAsync((Discount?)null);

            var service = new DiscountService(mockRepo.Object);

            // Act
            var result = await service.GetByIdAsync(99);

            // Assert
            Assert.Null(result);
        }

        [Fact]
        public async Task GetByIdAsync_ShouldReturnDiscountDto_WhenFound()
        {
            // Arrange
            var mockRepo = new Mock<IDiscountRepository>();
            var discount = new AbsoluteValueDiscount { Id = 1, Code = "DISC1", Amount = 10, StartingDate = DateTime.UtcNow.AddDays(-1), ExpirationDate = DateTime.UtcNow.AddDays(1) };
            mockRepo.Setup(r => r.GetByIdAsync(1)).ReturnsAsync(discount);

            var service = new DiscountService(mockRepo.Object);

            // Act
            var result = await service.GetByIdAsync(1);

            // Assert
            Assert.NotNull(result);
            Assert.Equal(1, result.Id);
            Assert.Equal("DISC1", result.Code);
        }

        [Fact]
        public async Task CreateAbsoluteValueDiscountAsync_ShouldReturnDto()
        {
            // Arrange
            var mockRepo = new Mock<IDiscountRepository>();
            var service = new DiscountService(mockRepo.Object);
            var dto = new CreateAbsoluteValueDiscountDto
            {
                Code = "ABS50",
                Amount = 50,
                StartingDate = DateTime.UtcNow,
                ExpirationDate = DateTime.UtcNow.AddDays(10)
            };

            // Act
            var result = await service.CreateAbsoluteValueDiscountAsync(dto);

            // Assert
            Assert.NotNull(result);
            Assert.Equal("ABS50", result.Code);
            mockRepo.Verify(r => r.AddAsync(It.IsAny<AbsoluteValueDiscount>()), Times.Once);
        }

        [Fact]
        public async Task CreatePercentageDiscountAsync_ShouldReturnDto()
        {
            // Arrange
            var mockRepo = new Mock<IDiscountRepository>();
            var service = new DiscountService(mockRepo.Object);
            var dto = new CreatePercentageDiscountDto
            {
                Code = "PERC10",
                Percentage = 10,
                StartingDate = DateTime.UtcNow,
                ExpirationDate = DateTime.UtcNow.AddDays(10)
            };

            // Act
            var result = await service.CreatePercentageDiscountAsync(dto);

            // Assert
            Assert.NotNull(result);
            Assert.Equal("PERC10", result.Code);
            mockRepo.Verify(r => r.AddAsync(It.IsAny<PercentageDiscount>()), Times.Once);
        }

        [Fact]
        public async Task CreateLoyaltyDiscountAsync_ShouldReturnDto()
        {
            // Arrange
            var mockRepo = new Mock<IDiscountRepository>();
            var service = new DiscountService(mockRepo.Object);
            var dto = new CreateLoyaltyDiscountDto
            {
                Code = "LOYAL15",
                DiscountValue = 15,
                StartingDate = DateTime.UtcNow,
                ExpirationDate = DateTime.UtcNow.AddDays(10)
            };

            // Act
            var result = await service.CreateLoyaltyDiscountAsync(dto);

            // Assert
            Assert.NotNull(result);
            Assert.Equal("LOYAL15", result.Code);
            mockRepo.Verify(r => r.AddAsync(It.IsAny<LoyaltyDiscount>()), Times.Once);
        }

        [Fact]
        public async Task UpdateAsync_ShouldReturnFalse_WhenNotFound()
        {
            // Arrange
            var mockRepo = new Mock<IDiscountRepository>();
            mockRepo.Setup(r => r.GetByIdAsync(It.IsAny<int>())).ReturnsAsync((Discount?)null);
            var service = new DiscountService(mockRepo.Object);

            // Act
            var result = await service.UpdateAsync(new UpdateDiscountDto { Id = 10 });

            // Assert
            Assert.False(result);
        }

        [Fact]
        public async Task UpdateAsync_ShouldUpdateAndReturnTrue_WhenFound()
        {
            // Arrange
            var mockRepo = new Mock<IDiscountRepository>();
            var existing = new AbsoluteValueDiscount
            {
                Id = 1,
                Code = "OLD",
                StartingDate = DateTime.UtcNow,
                ExpirationDate = DateTime.UtcNow.AddDays(5)
            };
            mockRepo.Setup(r => r.GetByIdAsync(1)).ReturnsAsync(existing);
            var service = new DiscountService(mockRepo.Object);

            var dto = new UpdateDiscountDto
            {
                Id = 1,
                Code = "NEWCODE",
                StartingDate = DateTime.UtcNow.AddDays(1),
                ExpirationDate = DateTime.UtcNow.AddDays(6)
            };

            // Act
            var result = await service.UpdateAsync(dto);

            // Assert
            Assert.True(result);
            Assert.Equal("NEWCODE", existing.Code);
            mockRepo.Verify(r => r.UpdateAsync(existing), Times.Once);
        }

        [Fact]
        public async Task DeleteAsync_ShouldReturnFalse_WhenNotFound()
        {
            // Arrange
            var mockRepo = new Mock<IDiscountRepository>();
            mockRepo.Setup(r => r.GetByIdAsync(It.IsAny<int>())).ReturnsAsync((Discount?)null);
            var service = new DiscountService(mockRepo.Object);

            // Act
            var result = await service.DeleteAsync(5);

            // Assert
            Assert.False(result);
        }

        [Fact]
        public async Task DeleteAsync_ShouldDeleteAndReturnTrue_WhenFound()
        {
            // Arrange
            var mockRepo = new Mock<IDiscountRepository>();
            var existing = new AbsoluteValueDiscount { Id = 1 };
            mockRepo.Setup(r => r.GetByIdAsync(1)).ReturnsAsync(existing);
            var service = new DiscountService(mockRepo.Object);

            // Act
            var result = await service.DeleteAsync(1);

            // Assert
            Assert.True(result);
            mockRepo.Verify(r => r.DeleteAsync(1), Times.Once);
        }

        [Fact]
        public async Task GetPagedAsync_ShouldReturnPaginatedResults()
        {
            // Arrange
            var mockRepo = new Mock<IDiscountRepository>();
            var discounts = new List<Discount>
            {
                new AbsoluteValueDiscount { Id = 1, Code = "D1", StartingDate = DateTime.UtcNow, ExpirationDate = DateTime.UtcNow.AddDays(1) },
                new AbsoluteValueDiscount { Id = 2, Code = "D2", StartingDate = DateTime.UtcNow, ExpirationDate = DateTime.UtcNow.AddDays(1) }
            };
            mockRepo.Setup(r => r.GetAllAsync()).ReturnsAsync(discounts);
            var service = new DiscountService(mockRepo.Object);

            // Act
            var (items, totalCount) = await service.GetPagedAsync(1, 1);

            // Assert
            Assert.Equal(2, totalCount);
            Assert.Single(items);
            Assert.Equal("D1", items.First().Code);
        }

        [Fact]
        public async Task GetPagedFilteredAsync_ShouldFilterCorrectly()
        {
            // Arrange
            var mockRepo = new Mock<IDiscountRepository>();
            var discounts = new List<Discount>
            {
                new PercentageDiscount { Id = 1, Code = "SUMMER", Percentage = 20, StartingDate = DateTime.UtcNow, ExpirationDate = DateTime.UtcNow.AddDays(5) },
                new AbsoluteValueDiscount { Id = 2, Code = "WINTER", Amount = 10, StartingDate = DateTime.UtcNow, ExpirationDate = DateTime.UtcNow.AddDays(5) }
            };
            mockRepo.Setup(r => r.GetAllAsync()).ReturnsAsync(discounts);
            var service = new DiscountService(mockRepo.Object);

            // Act - Test filtering by search term and switch operator '>'
            var (items, totalCount) = await service.GetPagedFilteredAsync(
                pageNumber: 1,
                pageSize: 10,
                searchTerm: "SUMMER",
                type: null,
                startDate: null,
                endDate: null,
                compareValue: 10,
                compareOperator: ">"
            );

            // Assert
            Assert.Equal(1, totalCount);
            Assert.Equal("SUMMER", items.First().Code);
        }
    }
}