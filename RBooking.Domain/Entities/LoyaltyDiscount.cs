using Rbooking.Domain.Entities;

namespace RBooking.Domain.Entities;


public class LoyaltyDiscount : Discount
{
    public int RequiredReservationsCount { get; set; }
    public decimal Percentage { get; set; }
}
