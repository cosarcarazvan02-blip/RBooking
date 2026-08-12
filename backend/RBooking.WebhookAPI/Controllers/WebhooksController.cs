using System.Text.Json;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using RBooking.WebhookAPI.DTOs;
using RBooking.WebhookAPI.Services;

namespace RBooking.WebhookAPI.Controllers;

[ApiController]
[Route("api/webhooks")]
[AllowAnonymous]
public class WebhooksController : ControllerBase
{
    private readonly IWebhookSignatureVerifier _signatureVerifier;
    private readonly AccommodationUpdateProcessor _processor;
    private readonly ILogger<WebhooksController> _logger;

    public WebhooksController(
        IWebhookSignatureVerifier signatureVerifier,
        AccommodationUpdateProcessor processor,
        ILogger<WebhooksController> logger)
    {
        _signatureVerifier = signatureVerifier;
        _processor = processor;
        _logger = logger;
    }

    /// <summary>
    /// Receives the accommodation-updated webhook from API A. Authenticated via an
    /// HMAC-SHA256 request signature (X-Webhook-* headers), not a JWT.
    /// </summary>
    [HttpPost("accommodation-updated")]
    public async Task<IActionResult> AccommodationUpdated()
    {
        string rawBody;
        using (var reader = new StreamReader(Request.Body))
        {
            rawBody = await reader.ReadToEndAsync();
        }

        var timestamp = Request.Headers["X-Webhook-Timestamp"].FirstOrDefault();
        var webhookId = Request.Headers["X-Webhook-Id"].FirstOrDefault();
        var signature = Request.Headers["X-Webhook-Signature"].FirstOrDefault();

        if (!_signatureVerifier.Verify(timestamp, webhookId, signature, rawBody))
        {
            _logger.LogWarning("Webhook accommodation-updated respins: semnătură invalidă (WebhookId={WebhookId}).", webhookId);
            return Unauthorized(new { message = "Semnătura webhook-ului este invalidă." });
        }

        AccommodationUpdatedWebhookDto? payload;
        try
        {
            payload = JsonSerializer.Deserialize<AccommodationUpdatedWebhookDto>(rawBody, new JsonSerializerOptions
            {
                PropertyNameCaseInsensitive = true
            });
        }
        catch (JsonException)
        {
            return BadRequest(new { message = "Body invalid." });
        }

        if (payload == null)
        {
            return BadRequest(new { message = "Body invalid." });
        }

        await _processor.ProcessAsync(payload);

        return Ok();
    }
}
