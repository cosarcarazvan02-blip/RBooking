namespace RBooking.Application.DTOs;

public class UpdateDiscountDto
{
    public int Id { get; set; }
    public string? Code { get; set; }
    public DateTime? StartingDate { get; set; }
    public DateTime? ExpirationDate { get; set; }
    public bool? IsActive { get; set; }
}