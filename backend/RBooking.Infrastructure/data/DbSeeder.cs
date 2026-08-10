using Microsoft.EntityFrameworkCore;
using RBooking.Domain.Entities;
using RBooking.Domain.Enums;

namespace RBooking.Infrastructure.Data;

public static class DbSeeder
{
    public static async Task SeedUsersAsync(AppDbContext context)
    {
        var operatorUser = await context.Users.FirstOrDefaultAsync(u => u.Role == UserRole.Operator);
        if (operatorUser == null)
        {
            operatorUser = new User
            {
                Id = Guid.NewGuid(),
                FirstName = "Alex",
                LastName = "Operator",
                Email = "operator@rbooking.com",
                Role = UserRole.Operator,
                CreatedAt = DateTime.UtcNow
            };
            context.Users.Add(operatorUser);
        }

        var clientUser = await context.Users.FirstOrDefaultAsync(u => u.Role == UserRole.Client);
        if (clientUser == null)
        {
            clientUser = new User
            {
                Id = Guid.NewGuid(),
                FirstName = "Elena",
                LastName = "Popescu",
                Email = "elena.popescu@example.com",
                Role = UserRole.Client,
                CreatedAt = DateTime.UtcNow
            };
            context.Users.Add(clientUser);
        }

        var adminUser = await context.Users.FirstOrDefaultAsync(u => u.Role == UserRole.Admin);
        if (adminUser == null)
        {
            adminUser = new User
            {
                Id = Guid.NewGuid(),
                FirstName = "Admin",
                LastName = "System",
                Email = "admin@rbooking.com",
                Role = UserRole.Admin,
                CreatedAt = DateTime.UtcNow
            };
            context.Users.Add(adminUser);
        }

        await context.SaveChangesAsync();
    }

    public static async Task<int> SeedMockAccommodationsAsync(AppDbContext context)
    {
        await SeedUsersAsync(context);

        var operatorUser = await context.Users.FirstOrDefaultAsync(u => u.Role == UserRole.Operator);
        var opId = operatorUser?.Id.ToString() ?? Guid.NewGuid().ToString();

        var accommodations = new List<Accommodation>
        {
            new Hotel
            {
                Id = Guid.NewGuid(),
                Name = "Grand Plaza Hotel & Spa",
                Description = "Luxurious 5-star hotel in the heart of Bucharest with full spa services, indoor pool and fine dining.",
                Location = "Calea Victoriei 120",
                City = "Bucharest",
                Country = "Romania",
                PricePerNight = 450.00m,
                OperatorId = opId,
                Stars = 5,
                HasPool = true,
                HasRoomService = true,
                TotalRooms = 120,
                Images = new List<AccommodationImage>
                {
                    new AccommodationImage { FilePath = "https://images.unsplash.com/photo-1566073771259-6a8506099945", IsMain = true }
                }
            },
            new Hotel
            {
                Id = Guid.NewGuid(),
                Name = "Hotel Transylvania Castle",
                Description = "Charming 4-star medieval style luxury hotel with picturesque mountain views of Brașov.",
                Location = "Strada Republicii 45",
                City = "Brașov",
                Country = "Romania",
                PricePerNight = 320.00m,
                OperatorId = opId,
                Stars = 4,
                HasPool = true,
                HasRoomService = true,
                TotalRooms = 60,
                Images = new List<AccommodationImage>
                {
                    new AccommodationImage { FilePath = "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b", IsMain = true }
                }
            },
            new Hotel
            {
                Id = Guid.NewGuid(),
                Name = "Boutique Riviera Hotel",
                Description = "Elegant boutique hotel near the beach boardwalk in Constanța.",
                Location = "Bulevardul Mamaia 88",
                City = "Constanța",
                Country = "Romania",
                PricePerNight = 280.00m,
                OperatorId = opId,
                Stars = 4,
                HasPool = false,
                HasRoomService = true,
                TotalRooms = 35,
                Images = new List<AccommodationImage>
                {
                    new AccommodationImage { FilePath = "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb", IsMain = true }
                }
            },
            new Apartment
            {
                Id = Guid.NewGuid(),
                Name = "Skyline Luxury Penthouse",
                Description = "Panoramic views over Bucharest with modern furnishings, balcony, and private parking.",
                Location = "Bulevardul Unirii 10",
                City = "Bucharest",
                Country = "Romania",
                PricePerNight = 380.00m,
                OperatorId = opId,
                FloorNumber = 12,
                HasElevator = true,
                NumberOfRooms = 4,
                IsFurnished = true,
                Images = new List<AccommodationImage>
                {
                    new AccommodationImage { FilePath = "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688", IsMain = true }
                }
            },
            new Apartment
            {
                Id = Guid.NewGuid(),
                Name = "Old Town Cosy Studio",
                Description = "Warm, traditional studio located right in the historical cobblestone center of Brașov.",
                Location = "Piața Sfatului 4",
                City = "Brașov",
                Country = "Romania",
                PricePerNight = 140.00m,
                OperatorId = opId,
                FloorNumber = 2,
                HasElevator = false,
                NumberOfRooms = 1,
                IsFurnished = true,
                Images = new List<AccommodationImage>
                {
                    new AccommodationImage { FilePath = "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267", IsMain = true }
                }
            },
            new Apartment
            {
                Id = Guid.NewGuid(),
                Name = "ParkView Modern Flat",
                Description = "Bright three-room apartment adjacent to Central Park in Cluj-Napoca.",
                Location = "Strada Parcului 22",
                City = "Cluj-Napoca",
                Country = "Romania",
                PricePerNight = 210.00m,
                OperatorId = opId,
                FloorNumber = 5,
                HasElevator = true,
                NumberOfRooms = 3,
                IsFurnished = true,
                Images = new List<AccommodationImage>
                {
                    new AccommodationImage { FilePath = "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2", IsMain = true }
                }
            },
            new Hostel
            {
                Id = Guid.NewGuid(),
                Name = "Backpackers Haven Hostel",
                Description = "Vibrant budget hostel for travelers with shared kitchen, lounge, and organized city tours.",
                Location = "Strada Lipscani 30",
                City = "Bucharest",
                Country = "Romania",
                PricePerNight = 45.00m,
                OperatorId = opId,
                BedInSharedRoomPrice = 45.00m,
                HasSharedKitchen = true,
                TotalBeds = 40,
                Images = new List<AccommodationImage>
                {
                    new AccommodationImage { FilePath = "https://images.unsplash.com/photo-1555854877-bab0e564b8d5", IsMain = true }
                }
            },
            new Hostel
            {
                Id = Guid.NewGuid(),
                Name = "Mountain Adventurers Hostel",
                Description = "Cozy basecamp for hikers and skiers visiting Tâmpa and Poiana Brașov.",
                Location = "Strada Mureșenilor 12",
                City = "Brașov",
                Country = "Romania",
                PricePerNight = 55.00m,
                OperatorId = opId,
                BedInSharedRoomPrice = 55.00m,
                HasSharedKitchen = true,
                TotalBeds = 30,
                Images = new List<AccommodationImage>
                {
                    new AccommodationImage { FilePath = "https://images.unsplash.com/photo-1596394516093-501ba68a0ba6", IsMain = true }
                }
            }
        };

        context.Accommodations.AddRange(accommodations);
        await context.SaveChangesAsync();

        return accommodations.Count;
    }
}
