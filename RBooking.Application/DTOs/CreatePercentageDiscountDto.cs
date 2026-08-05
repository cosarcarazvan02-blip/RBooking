namespace RBooking.Application.DTOs;

public class CreatePercentageDiscountDto
{
    public string Code { get; set; } = string.Empty;
    public decimal Percentage { get; set; } 
    public DateTime StartingDate { get; set; }
    public DateTime ExpirationDate { get; set; }
}