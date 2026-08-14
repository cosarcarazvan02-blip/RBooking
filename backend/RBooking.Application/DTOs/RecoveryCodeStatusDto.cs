namespace RBooking.Application.DTOs;

public class RecoveryCodeStatusDto
{
    public bool TwoFactorEnabled { get; set; }
    public bool HasRecoveryCodes { get; set; }
    public int TotalCodes { get; set; }
    public int RemainingCodes { get; set; }
}
