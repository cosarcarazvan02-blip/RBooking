using System;
using Rbooking.Domain.Entities;

namespace RBooking.Domain.Entities
{
    public class PercentageDiscount : Discount
    {
        public decimal Percentage { get; set; }
    }
}
