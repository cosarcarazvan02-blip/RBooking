namespace RBooking.Domain.Entities;

public class Hostel : Accommodation
{
    public decimal BedInSharedRoomPrice { get; set; }
    public bool HasSharedKitchen { get; set; }
    public int TotalBeds { get; set; }
}
