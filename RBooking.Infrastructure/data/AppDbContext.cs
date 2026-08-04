using Microsoft.EntityFrameworkCore;
using Rbooking.Domain.Entities;
using RBooking.Domain.Entities;

namespace RBooking.Infrastructure.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
    {
    }

    public DbSet<User> Users => Set<User>();
    public DbSet<Review> Reviews => Set<Review>();
    public DbSet<Reservation> Reservations => Set<Reservation>();
    public DbSet<LoyaltyDiscount> LoyaltyDiscounts => Set<LoyaltyDiscount>();
    public DbSet<AbsoluteValueDiscount> AbsoluteValueDiscounts => Set<AbsoluteValueDiscount>();
    public DbSet<PercentageDiscount> PercentageDiscounts => Set<PercentageDiscount>();
}