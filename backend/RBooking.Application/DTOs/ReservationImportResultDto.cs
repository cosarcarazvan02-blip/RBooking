namespace RBooking.Application.DTOs;

public class ReservationImportResultDto
{
    public int SuccessfulCount { get; set; }
    public int FailedCount { get; set; }
    public Dictionary<int, List<string>> Errors { get; set; } = new();
}