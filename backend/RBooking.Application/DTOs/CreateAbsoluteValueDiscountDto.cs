namespace RBooking.Application.DTOs;

public class CreateAbsoluteValueDiscountDto
{
    public string Code { get; set; } = string.Empty;
    public decimal Amount { get; set; } 
    public DateTime StartingDate { get; set; }
    public DateTime ExpirationDate { get; set; }
}