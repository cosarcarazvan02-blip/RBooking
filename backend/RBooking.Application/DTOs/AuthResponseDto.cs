namespace RBooking.Application.DTOs;

public class AuthResponseDto
{
    public string Token { get; set; } = string.Empty;
    public UserDto? User { get; set; }
    public bool RequiresTwoFactor { get; set; } = false;
    public int? RemainingRecoveryCodes { get; set; }
    public string? WarningMessage { get; set; }
    public string? Message { get; set; }
}
