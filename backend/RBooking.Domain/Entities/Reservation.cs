using RBooking.Domain.Enums;

namespace RBooking.Domain.Entities;

public class Reservation
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid UserId { get; set; }
    public User? User { get; set; }
    public Guid AccommodationId { get; set; }
    public Accommodation? Accommodation { get; set; }
    public DateTime CheckInDate { get; set; }
    public DateTime CheckOutDate { get; set; }
    public int NumberOfGuests { get; set; }
    public decimal TotalPrice { get; set; }
    public ReservationStatus Status { get; set; } = ReservationStatus.Pending;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Instantaneu al comisionului platformei la momentul rezervării - dacă rata din
    // config se schimbă ulterior, rezervările vechi rămân cu rata cu care au fost create.
    public decimal PlatformFeeRate { get; set; }
    public decimal PlatformFeeAmount { get; set; }
    public decimal OperatorPayoutAmount { get; set; }
}
