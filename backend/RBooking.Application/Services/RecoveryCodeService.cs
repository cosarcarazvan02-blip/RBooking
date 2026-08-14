using System.Security.Cryptography;
using System.Text;
using RBooking.Application.DTOs;
using RBooking.Application.Interfaces;
using RBooking.Domain.Entities;

namespace RBooking.Application.Services;

public class RecoveryCodeService : IRecoveryCodeService
{
    private readonly IRecoveryCodeRepository _recoveryCodeRepository;
    private readonly IUserRepository _userRepository;
    private readonly IJwtTokenGenerator _jwtTokenGenerator;

    // Charset without ambiguous characters (0, O, 1, I, L)
    private const string CodeChars = "23456789ABCDEFGHJKMNPQRSTUVWXYZ";

    public RecoveryCodeService(
        IRecoveryCodeRepository recoveryCodeRepository,
        IUserRepository userRepository,
        IJwtTokenGenerator jwtTokenGenerator)
    {
        _recoveryCodeRepository = recoveryCodeRepository;
        _userRepository = userRepository;
        _jwtTokenGenerator = jwtTokenGenerator;
    }

    public async Task<GeneratedRecoveryCodesDto> GenerateCodesAsync(Guid userId, int count = 10)
    {
        var user = await _userRepository.GetByIdAsync(userId);
        if (user == null)
        {
            throw new KeyNotFoundException($"Utilizatorul cu ID-ul {userId} nu a fost găsit.");
        }

        var totalExisting = await _recoveryCodeRepository.GetTotalCountByUserIdAsync(userId);
        if (totalExisting > 0)
        {
            throw new InvalidOperationException("Codurile de recuperare au fost deja generate pentru acest cont. Generarea este permisă o singură dată.");
        }

        var codes = new HashSet<string>();
        while (codes.Count < count)
        {
            codes.Add(GenerateSingleFormattedCode());
        }

        var plainCodesList = codes.ToList();
        var hashes = plainCodesList.Select(c => HashCode(NormalizeCode(c))).ToList();

        await _recoveryCodeRepository.SaveCodesAsync(userId, hashes);

        return new GeneratedRecoveryCodesDto
        {
            Codes = plainCodesList,
            TotalCount = count,
            RemainingCount = count,
            CreatedAt = DateTime.UtcNow
        };
    }

    public async Task<RecoveryCodeStatusDto> GetStatusAsync(Guid userId)
    {
        var user = await _userRepository.GetByIdAsync(userId);
        var remaining = await _recoveryCodeRepository.GetRemainingCountByUserIdAsync(userId);
        var total = await _recoveryCodeRepository.GetTotalCountByUserIdAsync(userId);

        return new RecoveryCodeStatusDto
        {
            TwoFactorEnabled = user?.TwoFactorEnabled ?? false,
            HasRecoveryCodes = remaining > 0,
            TotalCodes = total,
            RemainingCodes = remaining
        };
    }

    public async Task<RecoveryCodeLoginResponseDto?> VerifyAndConsumeRecoveryCodeAsync(string email, string code)
    {
        if (string.IsNullOrWhiteSpace(email) || string.IsNullOrWhiteSpace(code))
        {
            return null;
        }

        var user = await _userRepository.GetByEmailAsync(email.Trim());
        if (user == null)
        {
            return null;
        }

        var normalizedCode = NormalizeCode(code);
        if (normalizedCode.Length < 6)
        {
            return null;
        }

        var hash = HashCode(normalizedCode);
        var (success, remainingCount) = await _recoveryCodeRepository.ConsumeCodeAsync(user.Id, hash);

        if (!success)
        {
            return null;
        }

        var token = _jwtTokenGenerator.GenerateToken(user);

        string? warningMessage = null;
        if (remainingCount <= 2)
        {
            warningMessage = remainingCount == 0
                ? "Atenție! Ați utilizat toate codurile de recuperare. Vă rugăm să generați un nou set din cont pentru a nu pierde accesul."
                : $"Avertisment: Mai aveți doar {remainingCount} cod(uri) de recuperare disponibile. Vă recomandăm să generați un nou set.";
        }

        return new RecoveryCodeLoginResponseDto
        {
            Token = token,
            User = new UserDto
            {
                Id = user.Id,
                FirstName = user.FirstName,
                LastName = user.LastName,
                Email = user.Email,
                ProfileImagePath = user.ProfileImagePath,
                Role = user.Role.ToString(),
                TwoFactorEnabled = user.TwoFactorEnabled,
                CreatedAt = user.CreatedAt
            },
            RemainingCodes = remainingCount,
            WarningMessage = warningMessage
        };
    }

    public async Task<bool> ToggleTwoFactorAsync(Guid userId, bool enabled)
    {
        var user = await _userRepository.GetByIdAsync(userId);
        if (user == null)
        {
            return false;
        }

        // Nu putem activa 2FA fara un secret TOTP deja confirmat (vezi TwoFactorController.Setup/Verify) -
        // altfel userul ar ramane blocat la urmatorul login, fara niciun cod valid de introdus.
        if (enabled && string.IsNullOrWhiteSpace(user.TwoFactorSecret))
        {
            return false;
        }

        user.TwoFactorEnabled = enabled;
        await _userRepository.UpdateAsync(user);
        return true;
    }

    public static string NormalizeCode(string code)
    {
        if (string.IsNullOrWhiteSpace(code)) return string.Empty;
        return new string(code.Where(char.IsLetterOrDigit).ToArray()).ToUpperInvariant();
    }

    public static string HashCode(string normalizedCode)
    {
        var hashBytes = SHA256.HashData(Encoding.UTF8.GetBytes(normalizedCode));
        return Convert.ToHexString(hashBytes).ToLowerInvariant();
    }

    private static string GenerateSingleFormattedCode()
    {
        var bytes = new byte[8];
        RandomNumberGenerator.Fill(bytes);
        var sb = new StringBuilder(9);
        for (int i = 0; i < 8; i++)
        {
            if (i == 4)
            {
                sb.Append('-');
            }
            sb.Append(CodeChars[bytes[i] % CodeChars.Length]);
        }
        return sb.ToString();
    }
}
