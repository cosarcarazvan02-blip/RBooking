using System;
namespace Rbooking.Domain.Entities
{

    public class Review
    {
        public int Id { get; set; }
        public string? FullName { get; set; }
        public int Rating { get; set; }
        public string? Comment { get; set; }
        public int UserId { get; set; }
        public int BookingId { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}
