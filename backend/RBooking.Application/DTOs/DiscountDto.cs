namespace RBooking.Application.DTOs;

public class DiscountDto
{
    public int Id { get; set; }
    public string Code { get; set; } = string.Empty;
    public DateTime StartingDate { get; set; }
    public DateTime ExpirationDate { get; set; }
    public bool IsActive { get; set; }
}