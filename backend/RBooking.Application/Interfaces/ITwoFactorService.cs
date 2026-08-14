using RBooking.Application.DTOs;

namespace RBooking.Application.Interfaces;

public interface ITwoFactorService
{
    Task<TwoFactorSetupResponseDto> SetupAsync(Guid userId);
    Task<bool> VerifyAndEnableAsync(Guid userId, string code);
    Task<bool> ValidateCodeAsync(Guid userId, string code);
    Task<TwoFactorStatusResponseDto> GetStatusAsync(Guid userId);
    Task<bool> DisableAsync(Guid userId, string code);
}
