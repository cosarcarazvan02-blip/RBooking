using System;
namespace Rbooking.Domain.Entities
{

    public class Review
    {
        public int Id { get; set; }
        public int Rating { get; set; }
        public string? Comment { get; set; }
        public int ReservationId { get; set; } 
        public Reservation? Reservation { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}
