namespace RBooking.Domain.Entities;

public class Hotel : Accommodation
{
    public int Stars { get; set; }
    public bool HasPool { get; set; }
    public bool HasRoomService { get; set; }
    public int TotalRooms { get; set; }
}
