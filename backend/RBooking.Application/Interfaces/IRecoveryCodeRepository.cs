using RBooking.Domain.Entities;

namespace RBooking.Application.Interfaces;

public interface IRecoveryCodeRepository
{
    Task<IEnumerable<RecoveryCode>> GetUnusedCodesByUserIdAsync(Guid userId);
    Task<int> GetRemainingCountByUserIdAsync(Guid userId);
    Task<int> GetTotalCountByUserIdAsync(Guid userId);
    Task SaveCodesAsync(Guid userId, IEnumerable<string> codeHashes);
    Task<(bool Success, int RemainingCount)> ConsumeCodeAsync(Guid userId, string codeHash);
    Task ClearCodesAsync(Guid userId);
}
