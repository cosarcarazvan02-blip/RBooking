using Microsoft.AspNetCore.DataProtection;
using OtpNet;
using QRCoder;
using RBooking.Application.DTOs;
using RBooking.Application.Interfaces;

namespace RBooking.Application.Services;

public class TwoFactorService : ITwoFactorService
{
    private const string Issuer = "RBooking";
    private const int SecretSizeBytes = 20; // 160 biti, recomandat de RFC 4226

    private readonly IUserRepository _userRepository;
    private readonly IDataProtector _protector;

    public TwoFactorService(IUserRepository userRepository, IDataProtectionProvider dataProtectionProvider)
    {
        _userRepository = userRepository;
        _protector = dataProtectionProvider.CreateProtector("RBooking.TwoFactorSecret.v1");
    }

    public async Task<TwoFactorSetupResponseDto> SetupAsync(Guid userId)
    {
        var user = await _userRepository.GetByIdAsync(userId)
            ?? throw new InvalidOperationException("Utilizatorul nu a fost găsit.");

        // Fiecare apel genereaza un secret nou "pending" - un setup anterior neconfirmat e invalidat.
        var secretBytes = KeyGeneration.GenerateRandomKey(SecretSizeBytes);
        var base32Secret = Base32Encoding.ToString(secretBytes);

        user.TwoFactorSecret = _protector.Protect(base32Secret);
        user.TwoFactorEnabled = false;
        user.TwoFactorEnabledAt = null;
        await _userRepository.UpdateAsync(user);

        var otpAuthUri = BuildOtpAuthUri(base32Secret, user.Email);

        return new TwoFactorSetupResponseDto
        {
            Secret = base32Secret,
            OtpAuthUri = otpAuthUri,
            QrCodeImageBase64 = GenerateQrPngBase64(otpAuthUri)
        };
    }

    public async Task<bool> VerifyAndEnableAsync(Guid userId, string code)
    {
        var user = await _userRepository.GetByIdAsync(userId);
        if (user == null || string.IsNullOrWhiteSpace(user.TwoFactorSecret))
        {
            return false;
        }

        if (!IsCodeValid(user.TwoFactorSecret, code))
        {
            return false;
        }

        user.TwoFactorEnabled = true;
        user.TwoFactorEnabledAt = DateTime.UtcNow;
        await _userRepository.UpdateAsync(user);
        return true;
    }

    public async Task<bool> ValidateCodeAsync(Guid userId, string code)
    {
        var user = await _userRepository.GetByIdAsync(userId);
        if (user == null || !user.TwoFactorEnabled || string.IsNullOrWhiteSpace(user.TwoFactorSecret))
        {
            return false;
        }

        return IsCodeValid(user.TwoFactorSecret, code);
    }

    public async Task<TwoFactorStatusResponseDto> GetStatusAsync(Guid userId)
    {
        var user = await _userRepository.GetByIdAsync(userId)
            ?? throw new InvalidOperationException("Utilizatorul nu a fost găsit.");

        return new TwoFactorStatusResponseDto
        {
            Enabled = user.TwoFactorEnabled,
            EnabledAt = user.TwoFactorEnabledAt
        };
    }

    public async Task<bool> DisableAsync(Guid userId, string code)
    {
        var user = await _userRepository.GetByIdAsync(userId);
        if (user == null || !user.TwoFactorEnabled || string.IsNullOrWhiteSpace(user.TwoFactorSecret))
        {
            return false;
        }

        if (!IsCodeValid(user.TwoFactorSecret, code))
        {
            return false;
        }

        user.TwoFactorEnabled = false;
        user.TwoFactorEnabledAt = null;
        user.TwoFactorSecret = null;
        await _userRepository.UpdateAsync(user);
        return true;
    }

    private bool IsCodeValid(string protectedSecret, string code)
    {
        if (string.IsNullOrWhiteSpace(code))
        {
            return false;
        }

        var base32Secret = _protector.Unprotect(protectedSecret);
        var totp = new Totp(Base32Encoding.ToBytes(base32Secret));
        return totp.VerifyTotp(code, out _, VerificationWindow.RfcSpecifiedNetworkDelay);
    }

    private static string BuildOtpAuthUri(string base32Secret, string email)
    {
        var label = Uri.EscapeDataString($"{Issuer}:{email}");
        var issuerParam = Uri.EscapeDataString(Issuer);
        return $"otpauth://totp/{label}?secret={base32Secret}&issuer={issuerParam}&algorithm=SHA1&digits=6&period=30";
    }

    private static string GenerateQrPngBase64(string content)
    {
        using var generator = new QRCodeGenerator();
        using var data = generator.CreateQrCode(content, QRCodeGenerator.ECCLevel.Q);
        using var pngQr = new PngByteQRCode(data);
        var bytes = pngQr.GetGraphic(10);
        return Convert.ToBase64String(bytes);
    }
}
