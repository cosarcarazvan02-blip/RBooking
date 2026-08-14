using RBooking.Domain.Enums;

namespace RBooking.Domain.Entities;

public class User
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string? ProfileImagePath { get; set; }
    public UserRole Role { get; set; } = UserRole.Client;
    public bool TwoFactorEnabled { get; set; } = false;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Secretul TOTP e criptat (Data Protection) inainte de a fi salvat aici - niciodata in clar.
    public string? TwoFactorSecret { get; set; }
    public bool TwoFactorEnabled { get; set; } = false;
    public DateTime? TwoFactorEnabledAt { get; set; }
}

