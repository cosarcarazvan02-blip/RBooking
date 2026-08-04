namespace RBooking.Application.DTOs;

public class CreateReservationDto
{
    public Guid UserId { get; set; }
    public Guid AccommodationId { get; set; }
    public DateTime CheckInDate { get; set; }
    public DateTime CheckOutDate { get; set; }
    public int NumberOfGuests { get; set; }
}
