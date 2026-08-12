using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using RBooking.ApiB.DTOs;
using RBooking.ApiB.Services;

namespace RBooking.ApiB.Controllers;

[ApiController]
[Route("api/[controller]")]
public class WebhooksController : ControllerBase
{
    private readonly IReviewAnalyticsService _analyticsService;
    private readonly IConfiguration _configuration;
    private readonly ILogger<WebhooksController> _logger;

    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNameCaseInsensitive = true
    };

    public WebhooksController(
        IReviewAnalyticsService analyticsService,
        IConfiguration configuration,
        ILogger<WebhooksController> logger)
    {
        _analyticsService = analyticsService;
        _configuration = configuration;
        _logger = logger;
    }

    /// <summary>
    /// Receives webhook notification from API A when a new review is published.
    /// Validates HMAC-SHA256 signature, resolves accommodation, fetches batches, and calculates averages.
    /// </summary>
    [HttpPost("reviews")]
    public async Task<IActionResult> ReceiveReviewWebhook()
    {
        var timestamp = Request.Headers["X-Webhook-Timestamp"].FirstOrDefault();
        var webhookId = Request.Headers["X-Webhook-Id"].FirstOrDefault();
        var signatureHeader = Request.Headers["X-Webhook-Signature"].FirstOrDefault();

        if (string.IsNullOrWhiteSpace(timestamp) || string.IsNullOrWhiteSpace(webhookId) || string.IsNullOrWhiteSpace(signatureHeader))
        {
            _logger.LogWarning("[Webhook] Missing required security headers in incoming webhook request.");
            return Unauthorized(new
            {
                message = "Acces refuzat: Lipsesc headerele obligatorii de securitate (X-Webhook-Timestamp, X-Webhook-Id, X-Webhook-Signature)."
            });
        }

        // Citim corpul brut al request-ului
        using var reader = new StreamReader(Request.Body, Encoding.UTF8);
        var rawBody = await reader.ReadToEndAsync();

        // Reconstruim payload-ul pentru verificare
        var payloadToSign = $"{timestamp}.{webhookId}.{rawBody}";
        var secret = _configuration["Webhooks:Secret"] ?? "RBooking_Webhook_Secret_2026_Secure_Key_Sign!";
        var expectedSignatureBytes = HMACSHA256.HashData(
            Encoding.UTF8.GetBytes(secret),
            Encoding.UTF8.GetBytes(payloadToSign));

        var suppliedHex = signatureHeader.StartsWith("sha256=", StringComparison.OrdinalIgnoreCase)
            ? signatureHeader.Substring(7).Trim()
            : signatureHeader.Trim();

        byte[] suppliedSignatureBytes;
        try
        {
            suppliedSignatureBytes = Convert.FromHexString(suppliedHex);
        }
        catch (FormatException)
        {
            _logger.LogWarning("[Webhook] Invalid hexadecimal signature format: {Signature}", signatureHeader);
            return Unauthorized(new { message = "Format invalid pentru semnătura HMAC (hex string expected)." });
        }

        // Verificare semnătură HMAC cu protecție împotriva atacurilor de sincronizare (FixedTimeEquals)
        if (expectedSignatureBytes.Length != suppliedSignatureBytes.Length ||
            !CryptographicOperations.FixedTimeEquals(expectedSignatureBytes, suppliedSignatureBytes))
        {
            _logger.LogWarning("[Webhook] HMAC signature validation failed for WebhookId: {WebhookId}", webhookId);
            return Unauthorized(new { message = "Semnătura webhook-ului este invalidă (HMAC verification failed)." });
        }

        _logger.LogInformation("[Webhook] Webhook signature verified successfully! WebhookId: {WebhookId}", webhookId);

        ReviewCreatedWebhookDto? webhookData;
        try
        {
            webhookData = JsonSerializer.Deserialize<ReviewCreatedWebhookDto>(rawBody, JsonOptions);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "[Webhook] Failed to parse JSON webhook payload.");
            return BadRequest(new { message = "Corpul cererii nu este un JSON valid conform contractului." });
        }

        if (webhookData == null || webhookData.ReservationId == Guid.Empty)
        {
            return BadRequest(new { message = "Payload-ul webhook-ului trebuie să conțină un ReservationId valid." });
        }

        try
        {
            // Procesăm webhook-ul: cerere B=>A pentru cazare + batch-uri rezervări + calcul average-uri
            var analytics = await _analyticsService.ProcessReviewCreatedWebhookAsync(
                webhookData.ReservationId,
                webhookData.ReviewId);

            return Ok(new
            {
                message = "Webhook procesat cu succes! S-au descărcat batch-urile și s-au recalculat statisticile pentru cazare.",
                webhookId,
                analytics
            });
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "[Webhook] Error processing webhook analytics pipeline: {Message}", ex.Message);
            return StatusCode(500, new { message = $"Eroare la procesarea cererilor B => A: {ex.Message}" });
        }
    }
}
