namespace RBooking.Application.DTOs;

public class CreateLoyaltyDiscountDto
{
    public string Code { get; set; } = string.Empty;
    public decimal DiscountValue { get; set; } 
    public DateTime StartingDate { get; set; }
    public DateTime ExpirationDate { get; set; }
    public int RequiredReservationsCount { get; internal set; }
}