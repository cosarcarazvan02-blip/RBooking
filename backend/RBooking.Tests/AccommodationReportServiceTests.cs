using Moq;
using RBooking.Application.DTOs;
using RBooking.Application.Interfaces;
using RBooking.Application.Services;
using Xunit;

namespace RBooking.Tests;

public class AccommodationReportServiceTests
{
    private readonly Mock<IAccommodationRepository> _mockRepo;
    private readonly AccommodationReportService _service;

    public AccommodationReportServiceTests()
    {
        _mockRepo = new Mock<IAccommodationRepository>();
        _service = new AccommodationReportService(_mockRepo.Object);
    }

    private static List<AccommodationDto> GetSampleDtos()
    {
        return new List<AccommodationDto>
        {
            new AccommodationDto
            {
                Id = Guid.NewGuid(),
                Name = "Grand Hotel Bucharest",
                Description = "Luxury hotel in city center",
                Location = "Central Square",
                City = "Bucharest",
                Country = "Romania",
                PricePerNight = 150.00m,
                OperatorId = Guid.NewGuid(),
                AccommodationType = "Hotel",
                AverageRating = 4.8,
                TotalReviewsCount = 25,
                Stars = 5,
                HasPool = true,
                HasRoomService = true,
                TotalRooms = 100
            },
            new AccommodationDto
            {
                Id = Guid.NewGuid(),
                Name = "Cozy Apartment Cluj",
                Description = "Modern apartment near park",
                Location = "Central Park",
                City = "Cluj-Napoca",
                Country = "Romania",
                PricePerNight = 85.50m,
                OperatorId = Guid.NewGuid(),
                AccommodationType = "Apartment",
                AverageRating = 4.5,
                TotalReviewsCount = 12,
                FloorNumber = 3,
                HasElevator = true,
                NumberOfRooms = 2,
                IsFurnished = true
            }
        };
    }

    [Fact]
    public async Task GenerateReportAsync_ShouldReturnCsvFormat_WhenCsvRequested()
    {
        // Arrange
        var dtos = GetSampleDtos();
        _mockRepo.Setup(r => r.GetReportDataAsync(It.IsAny<AccommodationReportFilterDto>()))
            .ReturnsAsync(dtos);

        var request = new AccommodationReportRequestDto
        {
            Format = "csv",
            Columns = new List<string> { "Id", "Name", "City", "PricePerNight" },
            Filters = new AccommodationReportFilterDto { City = "Bucharest" }
        };

        // Act
        var (content, contentType, fileName) = await _service.GenerateReportAsync(request);

        // Assert
        Assert.NotNull(content);
        Assert.True(content.Length > 0);
        Assert.Equal("text/csv", contentType);
        Assert.EndsWith(".csv", fileName);

        var csvText = System.Text.Encoding.UTF8.GetString(content);
        Assert.Contains("Id,Name,City,PricePerNight", csvText);
        Assert.Contains("Grand Hotel Bucharest", csvText);
    }

    [Fact]
    public async Task GenerateReportAsync_ShouldReturnXlsxFormat_WhenXlsxRequested()
    {
        // Arrange
        var dtos = GetSampleDtos();
        _mockRepo.Setup(r => r.GetReportDataAsync(It.IsAny<AccommodationReportFilterDto>()))
            .ReturnsAsync(dtos);

        var request = new AccommodationReportRequestDto
        {
            Format = "xlsx",
            Columns = new List<string> { "Name", "Country", "PricePerNight" }
        };

        // Act
        var (content, contentType, fileName) = await _service.GenerateReportAsync(request);

        // Assert
        Assert.NotNull(content);
        Assert.True(content.Length > 0);
        Assert.Equal("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", contentType);
        Assert.EndsWith(".xlsx", fileName);
    }

    [Fact]
    public async Task GenerateReportAsync_ShouldReturnPdfFormat_WhenPdfRequested()
    {
        // Arrange
        var dtos = GetSampleDtos();
        _mockRepo.Setup(r => r.GetReportDataAsync(It.IsAny<AccommodationReportFilterDto>()))
            .ReturnsAsync(dtos);

        var request = new AccommodationReportRequestDto
        {
            Format = "pdf",
            Columns = new List<string> { "Id", "Name", "City", "Country", "PricePerNight" }
        };

        // Act
        var (content, contentType, fileName) = await _service.GenerateReportAsync(request);

        // Assert
        Assert.NotNull(content);
        Assert.True(content.Length > 0);
        Assert.Equal("application/pdf", contentType);
        Assert.EndsWith(".pdf", fileName);
    }

    [Fact]
    public async Task GenerateReportAsync_ShouldDefaultToAllColumns_WhenColumnsListIsEmpty()
    {
        // Arrange
        var dtos = GetSampleDtos();
        _mockRepo.Setup(r => r.GetReportDataAsync(It.IsAny<AccommodationReportFilterDto>()))
            .ReturnsAsync(dtos);

        var request = new AccommodationReportRequestDto
        {
            Format = "csv",
            Columns = null
        };

        // Act
        var (content, contentType, fileName) = await _service.GenerateReportAsync(request);

        // Assert
        var csvText = System.Text.Encoding.UTF8.GetString(content);
        Assert.Contains("Id,Name,Description,Location,City,Country,PricePerNight", csvText);
    }
}
