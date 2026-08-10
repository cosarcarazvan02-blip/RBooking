namespace RBooking.Application.DTOs;

public class FailedInsertItemDto
{
    public int LineNumber { get; set; }
    public List<string> Errors { get; set; } = new();

    public string FormattedMessage => $"linia {LineNumber}: {string.Join(", ", Errors)}";
}
