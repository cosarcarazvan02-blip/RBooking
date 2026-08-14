namespace RBooking.Application.DTOs;

public class GeneratedRecoveryCodesDto
{
    public List<string> Codes { get; set; } = new();
    public int TotalCount { get; set; }
    public int RemainingCount { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
