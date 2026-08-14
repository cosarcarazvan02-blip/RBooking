using Microsoft.EntityFrameworkCore;
using RBooking.Domain.Entities;

namespace RBooking.Infrastructure.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
    {
    }

    public DbSet<AccommodationImage> AccommodationImages { get; set; }
    public DbSet<ServiceClient> ServiceClients => Set<ServiceClient>();
    public DbSet<User> Users => Set<User>();
    public DbSet<Review> Reviews => Set<Review>();
    public DbSet<Reservation> Reservations => Set<Reservation>();
    public DbSet<HostApplication> HostApplications => Set<HostApplication>();
    public DbSet<WishlistItem> Wishlist => Set<WishlistItem>();
    public DbSet<RecoveryCode> RecoveryCodes => Set<RecoveryCode>();
    public DbSet<LoyaltyDiscount> LoyaltyDiscounts => Set<LoyaltyDiscount>();
    public DbSet<AbsoluteValueDiscount> AbsoluteValueDiscounts => Set<AbsoluteValueDiscount>();
    public DbSet<PercentageDiscount> PercentageDiscounts => Set<PercentageDiscount>();
    public DbSet<Discount> Discounts => Set<Discount>();

    // TPH Accommodation hierarchy
    public DbSet<Accommodation> Accommodations => Set<Accommodation>();
    public DbSet<Hotel> Hotels => Set<Hotel>();
    public DbSet<Apartment> Apartments => Set<Apartment>();
    public DbSet<Hostel> Hostels => Set<Hostel>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Table-Per-Hierarchy: Accommodation -> AccommodationImage
        modelBuilder.Entity<AccommodationImage>()
            .HasOne(img => img.Accommodation)
            .WithMany(acc => acc.Images)
            .HasForeignKey(img => img.AccommodationId)
            .OnDelete(DeleteBehavior.Cascade);

        // Table-Per-Hierarchy (TPH) Configuration for Accommodation
        modelBuilder.Entity<Accommodation>()
            .HasDiscriminator<string>("AccommodationType")
            .HasValue<Hotel>("Hotel")
            .HasValue<Apartment>("Apartment")
            .HasValue<Hostel>("Hostel");

        // Table-Per-Hierarchy (TPH) Configuration for Discount
        modelBuilder.Entity<Discount>()
            .HasDiscriminator<string>("DiscountDiscriminator")
            .HasValue<PercentageDiscount>("Percentage")
            .HasValue<AbsoluteValueDiscount>("AbsoluteValue")
            .HasValue<LoyaltyDiscount>("Loyalty");

        // O rezervare poate avea cel mult o recenzie (Unicitate 1:1)
        modelBuilder.Entity<Review>()
            .HasIndex(r => r.ReservationId)
            .IsUnique();

        // Wishlist configuration
        modelBuilder.Entity<WishlistItem>()
            .ToTable("Wishlist")
            .HasIndex(w => new { w.UserId, w.AccommodationId })
            .IsUnique();

        modelBuilder.Entity<WishlistItem>()
            .HasOne(w => w.User)
            .WithMany()
            .HasForeignKey(w => w.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<WishlistItem>()
            .HasOne(w => w.Accommodation)
            .WithMany()
            .HasForeignKey(w => w.AccommodationId)
            .OnDelete(DeleteBehavior.Cascade);

        // RecoveryCodes configuration
        modelBuilder.Entity<RecoveryCode>(entity =>
        {
            entity.ToTable("RecoveryCodes");
            entity.HasKey(r => r.Id);
            entity.HasIndex(r => new { r.UserId, r.IsUsed });
            entity.HasIndex(r => new { r.UserId, r.CodeHash });
            entity.HasOne(r => r.User)
                  .WithMany()
                  .HasForeignKey(r => r.UserId)
                  .OnDelete(DeleteBehavior.Cascade);
        });

        // Comisionul platformei - precizie explicită pentru câmpuri monetare noi
        modelBuilder.Entity<Reservation>(entity =>
        {
            entity.Property(r => r.PlatformFeeRate).HasPrecision(5, 4);
            entity.Property(r => r.PlatformFeeAmount).HasPrecision(18, 2);
            entity.Property(r => r.OperatorPayoutAmount).HasPrecision(18, 2);
        });

        // Un user poate avea o singură cerere HostApplication în starea Pending la un moment dat
        // (impus și la nivel de aplicație în HostApplicationService, nu doar aici)
        modelBuilder.Entity<HostApplication>()
            .HasIndex(a => a.UserId);
    }
}