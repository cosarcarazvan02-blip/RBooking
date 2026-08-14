using Microsoft.EntityFrameworkCore;
using RBooking.Application.Interfaces;
using RBooking.Domain.Entities;
using RBooking.Infrastructure.Data;

namespace RBooking.Infrastructure.Repositories;

public class RecoveryCodeRepository : IRecoveryCodeRepository
{
    private readonly AppDbContext _context;

    public RecoveryCodeRepository(AppDbContext context)
    {
        _context = context;
    }

    public async Task<IEnumerable<RecoveryCode>> GetUnusedCodesByUserIdAsync(Guid userId)
    {
        return await _context.RecoveryCodes
            .Where(rc => rc.UserId == userId && !rc.IsUsed)
            .OrderBy(rc => rc.CreatedAt)
            .ToListAsync();
    }

    public async Task<int> GetRemainingCountByUserIdAsync(Guid userId)
    {
        return await _context.RecoveryCodes
            .CountAsync(rc => rc.UserId == userId && !rc.IsUsed);
    }

    public async Task<int> GetTotalCountByUserIdAsync(Guid userId)
    {
        return await _context.RecoveryCodes
            .CountAsync(rc => rc.UserId == userId);
    }

    public async Task SaveCodesAsync(Guid userId, IEnumerable<string> codeHashes)
    {
        // Remove existing codes for this user to ensure only fresh batch is active
        var oldCodes = await _context.RecoveryCodes
            .Where(rc => rc.UserId == userId)
            .ToListAsync();

        _context.RecoveryCodes.RemoveRange(oldCodes);

        var newCodes = codeHashes.Select(hash => new RecoveryCode
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            CodeHash = hash,
            IsUsed = false,
            CreatedAt = DateTime.UtcNow
        });

        await _context.RecoveryCodes.AddRangeAsync(newCodes);
        await _context.SaveChangesAsync();
    }

    public async Task<(bool Success, int RemainingCount)> ConsumeCodeAsync(Guid userId, string codeHash)
    {
        var code = await _context.RecoveryCodes
            .FirstOrDefaultAsync(rc => rc.UserId == userId && rc.CodeHash == codeHash && !rc.IsUsed);

        if (code == null)
        {
            var remaining = await GetRemainingCountByUserIdAsync(userId);
            return (false, remaining);
        }

        code.IsUsed = true;
        code.UsedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();

        var remainingCount = await GetRemainingCountByUserIdAsync(userId);
        return (true, remainingCount);
    }

    public async Task ClearCodesAsync(Guid userId)
    {
        var codes = await _context.RecoveryCodes
            .Where(rc => rc.UserId == userId)
            .ToListAsync();

        _context.RecoveryCodes.RemoveRange(codes);
        await _context.SaveChangesAsync();
    }
}
