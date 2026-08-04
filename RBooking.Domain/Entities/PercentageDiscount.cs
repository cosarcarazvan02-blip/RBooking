using System;

namespace Rbooking.Domain.Entities
{
    public class PercentageDiscount : Discount
    {
        public decimal Percentage { get; set; }
    }
}
