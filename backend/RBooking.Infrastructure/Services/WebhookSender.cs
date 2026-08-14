using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using RBooking.Application.DTOs;
using RBooking.Application.Interfaces;

namespace RBooking.Infrastructure.Services;

public class WebhookSender : IWebhookSender
{
    private readonly HttpClient _httpClient;
    private readonly IConfiguration _configuration;
    private readonly ILogger<WebhookSender> _logger;

    public WebhookSender(HttpClient httpClient, IConfiguration configuration, ILogger<WebhookSender> logger)
    {
        _httpClient = httpClient;
        _configuration = configuration;
        _logger = logger;
    }

    public Task SendAccommodationUpdatedAsync(AccommodationUpdatedWebhookDto payload)
    {
        return SendSignedAsync("Webhooks:AccommodationUpdatedUrl", "accommodation-updated", payload, payload.AccommodationId);
    }

    public Task SendReservationCreatedAsync(ReservationCreatedWebhookDto payload)
    {
        return SendSignedAsync("Webhooks:ReservationCreatedUrl", "reservation-created", payload, payload.ReservationId);
    }

    private async Task SendSignedAsync(string urlConfigKey, string eventName, object payload, Guid correlationId)
    {
        var url = _configuration[urlConfigKey];
        var secret = _configuration["Webhooks:Secret"];

        if (string.IsNullOrWhiteSpace(url) || string.IsNullOrWhiteSpace(secret))
        {
            _logger.LogWarning("{ConfigKey} sau Webhooks:Secret nu sunt configurate - webhook-ul {Event} nu a fost trimis.", urlConfigKey, eventName);
            return;
        }

        try
        {
            var jsonBody = JsonSerializer.Serialize(payload);

            var timestamp = DateTimeOffset.UtcNow.ToUnixTimeSeconds().ToString();
            var webhookId = Guid.NewGuid().ToString();
            var payloadToSign = $"{timestamp}.{webhookId}.{jsonBody}";

            var signatureBytes = HMACSHA256.HashData(
                Encoding.UTF8.GetBytes(secret),
                Encoding.UTF8.GetBytes(payloadToSign));
            var signature = Convert.ToHexString(signatureBytes);

            using var request = new HttpRequestMessage(HttpMethod.Post, url)
            {
                Content = new StringContent(jsonBody, Encoding.UTF8, "application/json")
            };
            request.Headers.Add("X-Webhook-Timestamp", timestamp);
            request.Headers.Add("X-Webhook-Id", webhookId);
            request.Headers.Add("X-Webhook-Signature", $"sha256={signature}");

            var response = await _httpClient.SendAsync(request);
            if (!response.IsSuccessStatusCode)
            {
                _logger.LogWarning(
                    "Webhook {Event} a eșuat cu status {StatusCode} pentru {CorrelationId}.",
                    eventName, response.StatusCode, correlationId);
            }
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex,
                "Nu s-a putut trimite webhook-ul {Event} pentru {CorrelationId}.",
                eventName, correlationId);
        }
    }
}
