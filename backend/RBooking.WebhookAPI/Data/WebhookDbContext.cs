using Microsoft.EntityFrameworkCore;
using RBooking.WebhookAPI.Entities;

namespace RBooking.WebhookAPI.Data;

public class WebhookDbContext : DbContext
{
    public WebhookDbContext(DbContextOptions<WebhookDbContext> options) : base(options)
    {
    }

    public DbSet<AccommodationChangeLog> AccommodationChangeLogs => Set<AccommodationChangeLog>();
}
