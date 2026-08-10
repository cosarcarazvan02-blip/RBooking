namespace RBooking.Domain.Entities;

public class Apartment : Accommodation
{
    public int FloorNumber { get; set; }
    public bool HasElevator { get; set; }
    public int NumberOfRooms { get; set; }
    public bool IsFurnished { get; set; }
}
