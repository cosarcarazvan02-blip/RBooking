namespace RBooking.Application.DTOs;

public class RecoveryCodeLoginResponseDto
{
    public string Token { get; set; } = string.Empty;
    public UserDto User { get; set; } = null!;
    public int RemainingCodes { get; set; }
    public string? WarningMessage { get; set; }
}
