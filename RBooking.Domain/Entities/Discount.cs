using System;

namespace Rbooking.Domain.Entities;
public abstract class Discount{
    public int Id { get; set; }
    public string? Code { get; set; }
    public DateTime ExpirationDate { get; set; }
    public bool IsActive { get; set; } = true;
}

public class PercentageDiscount : Discount
{
    public decimal Percentage { get; set; }
}

public class AbsoluteValueDiscount : Discount
{
    public decimal Amount { get; set; }
}

public class LoyaltyDiscount : Discount
{
    public int RequiredReservationsCount { get; set; } 
    public decimal Percentage { get; set; }
}