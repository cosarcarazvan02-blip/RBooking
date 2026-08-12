using System.Security.Cryptography;
using System.Text;

namespace RBooking.WebhookAPI.Services;

public class WebhookSignatureVerifier : IWebhookSignatureVerifier
{
    private static readonly TimeSpan FreshnessWindow = TimeSpan.FromMinutes(5);

    private readonly IConfiguration _configuration;
    private readonly ILogger<WebhookSignatureVerifier> _logger;

    public WebhookSignatureVerifier(IConfiguration configuration, ILogger<WebhookSignatureVerifier> logger)
    {
        _configuration = configuration;
        _logger = logger;
    }

    public bool Verify(string? timestampHeader, string? webhookIdHeader, string? signatureHeader, string rawBody)
    {
        var secret = _configuration["Webhooks:Secret"];
        if (string.IsNullOrWhiteSpace(secret))
        {
            _logger.LogError("Webhooks:Secret nu este configurat - toate webhook-urile sunt refuzate.");
            return false;
        }

        if (string.IsNullOrWhiteSpace(timestampHeader) ||
            string.IsNullOrWhiteSpace(webhookIdHeader) ||
            string.IsNullOrWhiteSpace(signatureHeader))
        {
            return false;
        }

        if (!long.TryParse(timestampHeader, out var unixSeconds))
        {
            return false;
        }

        var timestampUtc = DateTimeOffset.FromUnixTimeSeconds(unixSeconds);
        if ((DateTimeOffset.UtcNow - timestampUtc).Duration() > FreshnessWindow)
        {
            _logger.LogWarning("Webhook respins: timestamp în afara ferestrei de valabilitate ({Timestamp}).", timestampUtc);
            return false;
        }

        var payloadToSign = $"{timestampHeader}.{webhookIdHeader}.{rawBody}";
        var expectedSignatureBytes = HMACSHA256.HashData(
            Encoding.UTF8.GetBytes(secret),
            Encoding.UTF8.GetBytes(payloadToSign));

        const string prefix = "sha256=";
        var suppliedHex = signatureHeader.StartsWith(prefix, StringComparison.OrdinalIgnoreCase)
            ? signatureHeader[prefix.Length..]
            : signatureHeader;

        byte[] suppliedSignatureBytes;
        try
        {
            suppliedSignatureBytes = Convert.FromHexString(suppliedHex);
        }
        catch (FormatException)
        {
            return false;
        }

        if (suppliedSignatureBytes.Length != expectedSignatureBytes.Length)
        {
            return false;
        }

        return CryptographicOperations.FixedTimeEquals(expectedSignatureBytes, suppliedSignatureBytes);
    }
}
