using System;
using Rbooking.Domain.Enum;

namespace RBooking.Domain.Entities;

public class Discount
{
    public int Id { get; set; }
    public string? Code { get; set; }
    public DiscountType Type { get; set; }
    public DateTime StartingDate { get; set; }
    public DateTime ExpirationDate { get; set; }
    public bool IsActive { get; set; } = true;
}

