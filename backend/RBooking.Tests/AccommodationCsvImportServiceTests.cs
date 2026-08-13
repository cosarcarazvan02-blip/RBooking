using Moq;
using RBooking.Application.Interfaces;
using RBooking.Application.Services;
using RBooking.Domain.Entities;
using System.Text;
using Xunit;

namespace RBooking.Tests;

public class AccommodationCsvImportServiceTests
{
    private readonly Mock<IAccommodationRepository> _mockRepo;
    private readonly AccommodationCsvImportService _service;

    public AccommodationCsvImportServiceTests()
    {
        _mockRepo = new Mock<IAccommodationRepository>();
        _service = new AccommodationCsvImportService(_mockRepo.Object);
    }

    [Fact]
    public async Task ImportCsvAsync_ValidCsv_ShouldSuccessfullyInsertAllRows()
    {
        // Arrange
        var csvContent = @"Name,Location,City,Country,PricePerNight,AccommodationType,Stars,HasPool
Hotel Premier,Center,Bucharest,Romania,300,Hotel,4,true
Sunny Apartment,Beach,Constanța,Romania,200,Apartment,,";

        using var stream = new MemoryStream(Encoding.UTF8.GetBytes(csvContent));

        _mockRepo.Setup(r => r.GetExistingUniqueKeysAsync())
            .ReturnsAsync(new HashSet<string>());

        _mockRepo.Setup(r => r.AddRangeAsync(It.IsAny<IEnumerable<Accommodation>>()))
            .Returns(Task.CompletedTask);

        // Act
        var result = await _service.ImportCsvAsync(stream, Guid.NewGuid());

        // Assert
        Assert.Equal(2, result.SuccessfulInsertCount);
        Assert.Equal(0, result.FailedInsertCount);
        Assert.Empty(result.FailedInserts);
        _mockRepo.Verify(r => r.AddRangeAsync(It.Is<IEnumerable<Accommodation>>(list => list.Count() == 2)), Times.Once);
    }

    [Fact]
    public async Task ImportCsvAsync_RowWithMultipleValidationErrors_ShouldCollectAllErrorsForThatLine()
    {
        // Arrange
        var csvContent = @"Name,Location,City,Country,PricePerNight,AccommodationType,Stars
,Center,Bucharest,Romania,invalid_price,UnknownType,10
Hotel Valid,Center,Bucharest,Romania,150,Hotel,3";

        using var stream = new MemoryStream(Encoding.UTF8.GetBytes(csvContent));

        _mockRepo.Setup(r => r.GetExistingUniqueKeysAsync())
            .ReturnsAsync(new HashSet<string>());

        // Act
        var result = await _service.ImportCsvAsync(stream, Guid.NewGuid());

        // Assert
        Assert.Equal(1, result.SuccessfulInsertCount);
        Assert.Equal(1, result.FailedInsertCount);
        Assert.Single(result.FailedInserts);

        var failedLine = result.FailedInserts[0];
        Assert.StartsWith("linia 2:", failedLine);
        Assert.Contains("Numele este obligatoriu", failedLine);
        Assert.Contains("Prețul pe noapte trebuie să fie un număr valid", failedLine);
        Assert.Contains("Tipul de cazare trebuie să fie Hotel, Apartment sau Hostel", failedLine);
        Assert.Contains("Numărul de stele trebuie să fie între 1 și 5", failedLine);
    }

    [Fact]
    public async Task ImportCsvAsync_DuplicateEntry_ShouldReportDuplicateError()
    {
        // Arrange
        var csvContent = @"Name,Location,City,Country,PricePerNight,AccommodationType
Existing Hotel,Center,Bucharest,Romania,250,Hotel";

        using var stream = new MemoryStream(Encoding.UTF8.GetBytes(csvContent));

        var existingKeys = new HashSet<string>
        {
            "existing hotel|bucharest|center|hotel"
        };

        _mockRepo.Setup(r => r.GetExistingUniqueKeysAsync())
            .ReturnsAsync(existingKeys);

        // Act
        var result = await _service.ImportCsvAsync(stream);

        // Assert
        Assert.Equal(0, result.SuccessfulInsertCount);
        Assert.Equal(1, result.FailedInsertCount);
        Assert.Single(result.FailedInserts);
        Assert.Contains("duplicat", result.FailedInserts[0]);
    }

    [Fact]
    public async Task ImportCsvAsync_WithImages_ShouldAttachImagesCorrectly()
    {
        // Arrange
        var csvContent = @"Name,Location,City,Country,PricePerNight,AccommodationType,ImageUrl
Hotel Sunset,Beach,Mamaia,Romania,400,Hotel,https://example.com/img1.jpg;https://example.com/img2.jpg";

        using var stream = new MemoryStream(Encoding.UTF8.GetBytes(csvContent));

        _mockRepo.Setup(r => r.GetExistingUniqueKeysAsync())
            .ReturnsAsync(new HashSet<string>());

        IEnumerable<Accommodation>? capturedAccommodations = null;
        _mockRepo.Setup(r => r.AddRangeAsync(It.IsAny<IEnumerable<Accommodation>>()))
            .Callback<IEnumerable<Accommodation>>(list => capturedAccommodations = list)
            .Returns(Task.CompletedTask);

        // Act
        var result = await _service.ImportCsvAsync(stream, Guid.NewGuid());

        // Assert
        Assert.Equal(1, result.SuccessfulInsertCount);
        Assert.NotNull(capturedAccommodations);
        var inserted = capturedAccommodations!.First();
        Assert.Equal(2, inserted.Images.Count);
        
        var mainImg = inserted.Images.First();
        Assert.Equal("https://example.com/img1.jpg", mainImg.FilePath);
        Assert.True(mainImg.IsMain);

        var secondImg = inserted.Images.Last();
        Assert.Equal("https://example.com/img2.jpg", secondImg.FilePath);
        Assert.False(secondImg.IsMain);
    }
}

