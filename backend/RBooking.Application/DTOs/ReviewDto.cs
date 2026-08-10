namespace RBooking.Application.DTOs;

public class ReviewDto
{
    public int Id { get; set; }
    public int Rating { get; set; }
    public string? Comment { get; set; } 
    public Guid ReservationId { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class CreateReviewDto
{
    public int Rating { get; set; }
    public string? Comment { get; set; }
    public Guid ReservationId { get; set; }
}

public class UpdateReviewDto
{
    public int? Rating { get; set; }
    public string? Comment { get; set; }
}