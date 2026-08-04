using Rbooking.Domain.Entities;

namespace RBooking.Domain.Entities;

public class AbsoluteValueDiscount : Discount
{
    public decimal Amount { get; set; }
}