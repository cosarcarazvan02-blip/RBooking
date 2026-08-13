namespace RBooking.Domain.Entities;

public class WishlistItem
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public User? User { get; set; }
    public Guid AccommodationId { get; set; }
    public Accommodation? Accommodation { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
