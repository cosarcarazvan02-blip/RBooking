using Microsoft.EntityFrameworkCore;
using RBooking.Application.DTOs;
using RBooking.Application.Services;
using RBooking.Domain.Entities;
using RBooking.Infrastructure.Data;
using RBooking.Infrastructure.Repositories;
using Xunit;

public class AccommodationServiceTests
{
    private AppDbContext GetInMemoryDbContext()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;
        
        return new AppDbContext(options);
    }

    [Fact]
    public async Task GetFilteredAccommodationsAsync_ShouldFilterByLocationAndPrice()
    {
        // Arrange
        using var context = GetInMemoryDbContext();
        context.Accommodations.Add(new Accommodation { Id = Guid.NewGuid(), Name = "Hotel Central", Location = "Cluj-Napoca", City = "Cluj-Napoca", Country = "Romania", PricePerNight = 150 });
        context.Accommodations.Add(new Accommodation { Id = Guid.NewGuid(), Name = "Cabana Munte", Location = "Brasov", City = "Brasov", Country = "Romania", PricePerNight = 300 });
        context.Accommodations.Add(new Accommodation { Id = Guid.NewGuid(), Name = "Pensiunea Veche", Location = "Cluj-Napoca", City = "Cluj-Napoca", Country = "Romania", PricePerNight = 80 });
        await context.SaveChangesAsync();

        var repository = new AccommodationRepository(context);
        var service = new AccommodationService(repository);
        var filter = new AccommodationFilterDto
        {
            SearchLocation = "cluj",
            MinPrice = 100,
            PageNumber = 1,
            PageSize = 10
        };

        // Act
        var result = await service.GetFilteredAccommodationsAsync(filter);

        // Assert
        Assert.Single(result.Items);
        Assert.Equal(1, result.TotalCount);
        Assert.Equal("Hotel Central", result.Items.First().Name);
    }
}