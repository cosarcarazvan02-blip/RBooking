using Xunit;
using Moq;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using RBooking.Application.Services;
using RBooking.Application.DTOs;
using RBooking.Infrastructure.Repositories;
using RBooking.Domain.Entities;
using RBooking.Application.Interfaces;

namespace RBooking.Tests
{
    public class AccommodationServiceTests
    {
        [Fact]
        public async Task GetFilteredAccommodationsAsync_ShouldReturnPagedResult()
        {
            // Arrange
            var mockRepo = new Mock<IAccommodationRepository>();
            var accommodations = new List<Accommodation>
            {
                new Hotel { Id = Guid.NewGuid(), Name = "Grand Hotel", City = "Cluj", Stars = 5, HasPool = true }
            };
            var ratingStats = new Dictionary<Guid, (double, int)>
            {
                { accommodations[0].Id, (4.5, 10) }
            };

            mockRepo.Setup(r => r.GetFilteredAsync(It.IsAny<AccommodationFilterDto>()))
                    .ReturnsAsync((accommodations, 1, ratingStats));

            var service = new AccommodationService(mockRepo.Object, Mock.Of<IWebhookSender>());
            var filter = new AccommodationFilterDto { PageNumber = 1, PageSize = 10 };

            // Act
            var result = await service.GetFilteredAccommodationsAsync(filter);

            // Assert
            Assert.NotNull(result);
            Assert.Equal(1, result.TotalCount);
            var item = Assert.Single(result.Items);
            Assert.Equal("Grand Hotel", item.Name);
            Assert.Equal(4.5, item.AverageRating);
            Assert.Equal(10, item.TotalReviewsCount);
            Assert.Equal(5, item.Stars);
        }

        [Fact]
        public async Task GetAccommodationByIdAsync_ShouldReturnNull_WhenNotFound()
        {
            // Arrange
            var mockRepo = new Mock<IAccommodationRepository>();
            var missingId = Guid.NewGuid();
            mockRepo.Setup(r => r.GetByIdAsync(missingId)).ReturnsAsync((Accommodation?)null);

            var service = new AccommodationService(mockRepo.Object, Mock.Of<IWebhookSender>());

            // Act
            var result = await service.GetAccommodationByIdAsync(missingId);

            // Assert
            Assert.Null(result);
        }

        [Fact]
        public async Task GetAccommodationByIdAsync_ShouldReturnApartmentDto_WhenFound()
        {
            // Arrange
            var mockRepo = new Mock<IAccommodationRepository>();
            var aptId = Guid.NewGuid();
            var apartment = new Apartment 
            { 
                Id = aptId, 
                Name = "City Apartment", 
                FloorNumber = 3, 
                HasElevator = true, 
                NumberOfRooms = 2, 
                IsFurnished = true 
            };

            mockRepo.Setup(r => r.GetByIdAsync(aptId)).ReturnsAsync(apartment);
            mockRepo.Setup(r => r.GetRatingStatsAsync(aptId)).ReturnsAsync((4.0, 5));

            var service = new AccommodationService(mockRepo.Object, Mock.Of<IWebhookSender>());

            // Act
            var result = await service.GetAccommodationByIdAsync(aptId);

            // Assert
            Assert.NotNull(result);
            Assert.Equal("City Apartment", result.Name);
            Assert.Equal(3, result.FloorNumber);
            Assert.True(result.HasElevator);
            Assert.Equal(2, result.NumberOfRooms);
            Assert.True(result.IsFurnished);
        }

        [Fact]
        public async Task GetAccommodationByIdAsync_ShouldReturnHostelDto_WhenFound()
        {
            // Arrange
            var mockRepo = new Mock<IAccommodationRepository>();
            var hostelId = Guid.NewGuid();
            var hostel = new Hostel 
            { 
                Id = hostelId, 
                Name = "Backpackers Hostel", 
                BedInSharedRoomPrice = 25.0m, 
                HasSharedKitchen = true, 
                TotalBeds = 20 
            };

            mockRepo.Setup(r => r.GetByIdAsync(hostelId)).ReturnsAsync(hostel);
            mockRepo.Setup(r => r.GetRatingStatsAsync(hostelId)).ReturnsAsync((3.8, 2));

            var service = new AccommodationService(mockRepo.Object, Mock.Of<IWebhookSender>());

            // Act
            var result = await service.GetAccommodationByIdAsync(hostelId);

            // Assert
            Assert.NotNull(result);
            Assert.Equal("Backpackers Hostel", result.Name);
            Assert.Equal(25.0m, result.BedInSharedRoomPrice);
            Assert.True(result.HasSharedKitchen);
            Assert.Equal(20, result.TotalBeds);
        }

        [Fact]
        public async Task UpdateAccommodationAsync_WhenOperatorTriesToUpdateAnotherOperatorsAccommodation_ThrowsUnauthorizedAccessException()
        {
            // Arrange
            var mockRepo = new Mock<IAccommodationRepository>();
            var accId = Guid.NewGuid();
            var ownerOperatorId = Guid.NewGuid();
            var otherOperatorId = Guid.NewGuid();

            var accommodation = new Hotel
            {
                Id = accId,
                Name = "Original Hotel",
                OperatorId = ownerOperatorId
            };

            mockRepo.Setup(r => r.GetByIdAsync(accId)).ReturnsAsync(accommodation);

            var service = new AccommodationService(mockRepo.Object, Mock.Of<IWebhookSender>());
            var dto = new CreateAccommodationDto
            {
                Name = "Hacked Hotel",
                AccommodationType = "Hotel"
            };

            // Act & Assert
            await Assert.ThrowsAsync<UnauthorizedAccessException>(() =>
                service.UpdateAccommodationAsync(accId, otherOperatorId, RBooking.Domain.Enums.UserRole.Operator, dto));
            mockRepo.Verify(r => r.UpdateAsync(It.IsAny<Accommodation>()), Times.Never);
        }

        [Fact]
        public async Task UpdateAccommodationAsync_WhenOperatorUpdatesOwnAccommodation_Succeeds()
        {
            // Arrange
            var mockRepo = new Mock<IAccommodationRepository>();
            var accId = Guid.NewGuid();
            var ownerOperatorId = Guid.NewGuid();

            var accommodation = new Hotel
            {
                Id = accId,
                Name = "Original Hotel",
                OperatorId = ownerOperatorId
            };

            mockRepo.Setup(r => r.GetByIdAsync(accId)).ReturnsAsync(accommodation);
            mockRepo.Setup(r => r.UpdateAsync(It.IsAny<Accommodation>())).ReturnsAsync(accommodation);

            var service = new AccommodationService(mockRepo.Object, Mock.Of<IWebhookSender>());
            var dto = new CreateAccommodationDto
            {
                Name = "Updated Hotel",
                AccommodationType = "Hotel",
                PricePerNight = 250
            };

            // Act
            var success = await service.UpdateAccommodationAsync(accId, ownerOperatorId, RBooking.Domain.Enums.UserRole.Operator, dto);

            // Assert
            Assert.True(success);
            Assert.Equal("Updated Hotel", accommodation.Name);
            Assert.Equal(ownerOperatorId, accommodation.OperatorId);
            mockRepo.Verify(r => r.UpdateAsync(It.IsAny<Accommodation>()), Times.Once);
        }

        [Fact]
        public async Task DeleteAccommodationAsync_WhenOperatorTriesToDeleteAnotherOperatorsAccommodation_ThrowsUnauthorizedAccessException()
        {
            // Arrange
            var mockRepo = new Mock<IAccommodationRepository>();
            var accId = Guid.NewGuid();
            var ownerOperatorId = Guid.NewGuid();
            var otherOperatorId = Guid.NewGuid();

            var accommodation = new Hotel
            {
                Id = accId,
                Name = "Original Hotel",
                OperatorId = ownerOperatorId
            };

            mockRepo.Setup(r => r.GetByIdAsync(accId)).ReturnsAsync(accommodation);

            var service = new AccommodationService(mockRepo.Object, Mock.Of<IWebhookSender>());

            // Act & Assert
            await Assert.ThrowsAsync<UnauthorizedAccessException>(() =>
                service.DeleteAccommodationAsync(accId, otherOperatorId, RBooking.Domain.Enums.UserRole.Operator));
            mockRepo.Verify(r => r.DeleteAsync(It.IsAny<Guid>()), Times.Never);
        }
    }
}