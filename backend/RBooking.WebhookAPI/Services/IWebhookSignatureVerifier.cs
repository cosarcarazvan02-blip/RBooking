namespace RBooking.WebhookAPI.Services;

public interface IWebhookSignatureVerifier
{
    /// <summary>
    /// Reconstructs the signature API A computed over timestamp+webhookId+rawBody and
    /// compares it in constant time. Also rejects stale timestamps (replay protection).
    /// </summary>
    bool Verify(string? timestampHeader, string? webhookIdHeader, string? signatureHeader, string rawBody);
}
