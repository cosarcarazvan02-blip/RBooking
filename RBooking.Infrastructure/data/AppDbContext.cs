using Microsoft.EntityFrameworkCore;
using Rbooking.Domain.Entities;
using RBooking.Domain.Entities;

namespace RBooking.Infrastructure.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
    {
    }

    public DbSet<Review> Reviews => Set<Review>();
    public DbSet<Discount> Discounts => Set<Discount>();
    
    // TPH Accommodation hierarchy
    public DbSet<Accommodation> Accommodations => Set<Accommodation>();
    public DbSet<Hotel> Hotels => Set<Hotel>();
    public DbSet<Apartment> Apartments => Set<Apartment>();
    public DbSet<Hostel> Hostels => Set<Hostel>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Table-Per-Hierarchy (TPH) Configuration
        modelBuilder.Entity<Accommodation>()
            .HasDiscriminator<string>("AccommodationType")
            .HasValue<Hotel>("Hotel")
            .HasValue<Apartment>("Apartment")
            .HasValue<Hostel>("Hostel");
    }
}