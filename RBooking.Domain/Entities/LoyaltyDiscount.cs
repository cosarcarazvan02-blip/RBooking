using Rbooking.Domain.Entities;

namespace RBooking.Domain.Entities;

public class LoyaltyDiscount : Discount
{
    public int RequiredPoints { get; set; }
    public decimal DiscountPercentage { get; set; }
}
