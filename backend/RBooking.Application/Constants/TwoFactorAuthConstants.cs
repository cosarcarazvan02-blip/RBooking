namespace RBooking.Application.Constants;

public static class TwoFactorAuthConstants
{
    // Schema si audience distincte de token-ul normal "UserBearer", ca un token
    // "pending" (emis dupa parola corecta, inainte de codul TOTP) sa nu poata fi
    // folosit pe niciun alt endpoint protejat cat timp al doilea factor nu a fost confirmat.
    public const string PendingSchemeName = "TwoFactorPendingBearer";
    public const string PendingAudience = "RBookingClient.TwoFactorPending";
    public static readonly TimeSpan PendingTokenLifetime = TimeSpan.FromMinutes(5);
}
