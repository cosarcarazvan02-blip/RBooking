using System.Security.Cryptography;
using System.Text;
using Xunit;

namespace RBooking.Tests;

public class WebhookSignatureTests
{
    [Fact]
    public void HMACSHA256_SignAndVerify_WorksCorrectlyWithFixedTimeEquals()
    {
        // Arrange
        var secret = "RBooking_Webhook_Secret_2026_Secure_Key_Sign!";
        var timestamp = DateTimeOffset.UtcNow.ToUnixTimeSeconds().ToString();
        var webhookId = Guid.NewGuid().ToString();
        var jsonBody = "{\"eventType\":\"ReviewCreated\",\"reviewId\":42,\"reservationId\":\"00000000-0000-0000-0000-000000000001\"}";

        var payloadToSign = $"{timestamp}.{webhookId}.{jsonBody}";

        // Act - API A generates signature
        var signatureBytes = HMACSHA256.HashData(
            Encoding.UTF8.GetBytes(secret),
            Encoding.UTF8.GetBytes(payloadToSign));
        var signatureHex = Convert.ToHexString(signatureBytes);

        // Act - API B reconstructs and validates signature
        var expectedSignatureBytes = HMACSHA256.HashData(
            Encoding.UTF8.GetBytes(secret),
            Encoding.UTF8.GetBytes(payloadToSign));
        var suppliedBytes = Convert.FromHexString(signatureHex);

        var isMatch = CryptographicOperations.FixedTimeEquals(expectedSignatureBytes, suppliedBytes);

        // Assert
        Assert.True(isMatch);
    }

    [Fact]
    public void HMACSHA256_TamperedPayload_FailsValidation()
    {
        // Arrange
        var secret = "RBooking_Webhook_Secret_2026_Secure_Key_Sign!";
        var timestamp = DateTimeOffset.UtcNow.ToUnixTimeSeconds().ToString();
        var webhookId = Guid.NewGuid().ToString();
        var originalBody = "{\"eventType\":\"ReviewCreated\",\"reviewId\":42}";
        var tamperedBody = "{\"eventType\":\"ReviewCreated\",\"reviewId\":99}";

        var originalPayload = $"{timestamp}.{webhookId}.{originalBody}";
        var tamperedPayload = $"{timestamp}.{webhookId}.{tamperedBody}";

        // Act
        var originalSignatureBytes = HMACSHA256.HashData(
            Encoding.UTF8.GetBytes(secret),
            Encoding.UTF8.GetBytes(originalPayload));

        var tamperedExpectedBytes = HMACSHA256.HashData(
            Encoding.UTF8.GetBytes(secret),
            Encoding.UTF8.GetBytes(tamperedPayload));

        var isMatch = CryptographicOperations.FixedTimeEquals(tamperedExpectedBytes, originalSignatureBytes);

        // Assert
        Assert.False(isMatch);
    }
}
