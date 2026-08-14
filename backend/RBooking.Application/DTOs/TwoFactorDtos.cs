using System.ComponentModel.DataAnnotations;

namespace RBooking.Application.DTOs;

public class TwoFactorSetupResponseDto
{
    public string Secret { get; set; } = string.Empty;
    public string OtpAuthUri { get; set; } = string.Empty;
    public string QrCodeImageBase64 { get; set; } = string.Empty;
}

public class TwoFactorVerifyRequestDto
{
    [Required]
    [StringLength(6, MinimumLength = 6, ErrorMessage = "Codul trebuie să conțină exact 6 cifre.")]
    public string Code { get; set; } = string.Empty;
}

public class TwoFactorStatusResponseDto
{
    public bool Enabled { get; set; }
    public DateTime? EnabledAt { get; set; }
}

public class TwoFactorDisableRequestDto
{
    [Required]
    [StringLength(6, MinimumLength = 6, ErrorMessage = "Codul trebuie să conțină exact 6 cifre.")]
    public string Code { get; set; } = string.Empty;
}
