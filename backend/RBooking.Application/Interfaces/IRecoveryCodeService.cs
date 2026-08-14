using RBooking.Application.DTOs;

namespace RBooking.Application.Interfaces;

public interface IRecoveryCodeService
{
    Task<GeneratedRecoveryCodesDto> GenerateCodesAsync(Guid userId, int count = 10);
    Task<RecoveryCodeStatusDto> GetStatusAsync(Guid userId);
    Task<RecoveryCodeLoginResponseDto?> VerifyAndConsumeRecoveryCodeAsync(string email, string code);
    Task<bool> ToggleTwoFactorAsync(Guid userId, bool enabled);
}
