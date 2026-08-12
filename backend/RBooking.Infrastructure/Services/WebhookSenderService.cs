using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using RBooking.Application.Interfaces;

namespace RBooking.Infrastructure.Services;

public class WebhookSenderService : IWebhookSenderService
{
    private readonly HttpClient _httpClient;
    private readonly IConfiguration _configuration;
    private readonly ILogger<WebhookSenderService> _logger;

    public WebhookSenderService(
        HttpClient httpClient,
        IConfiguration configuration,
        ILogger<WebhookSenderService> logger)
    {
        _httpClient = httpClient;
        _configuration = configuration;
        _logger = logger;
    }

    public async Task SendReviewCreatedWebhookAsync(int reviewId, Guid reservationId)
    {
        var webhookUrl = _configuration["Webhooks:ApiBReviewWebhookUrl"]
            ?? _configuration["Webhooks:ApiBUrl"]
            ?? "http://localhost:5294/api/webhooks/reviews";

        var secret = _configuration["Webhooks:Secret"]
            ?? "RBooking_Webhook_Secret_2026_Secure_Key_Sign!";

        var notificationPayload = new
        {
            eventType = "ReviewCreated",
            reviewId = reviewId,
            reservationId = reservationId,
            timestamp = DateTimeOffset.UtcNow
        };

        var jsonBody = JsonSerializer.Serialize(notificationPayload);

        var timestamp = DateTimeOffset.UtcNow.ToUnixTimeSeconds().ToString();
        var webhookId = Guid.NewGuid().ToString();
        var payloadToSign = $"{timestamp}.{webhookId}.{jsonBody}";

        var signatureBytes = HMACSHA256.HashData(
            Encoding.UTF8.GetBytes(secret),
            Encoding.UTF8.GetBytes(payloadToSign));
        var signature = Convert.ToHexString(signatureBytes);

        try
        {
            using var request = new HttpRequestMessage(HttpMethod.Post, webhookUrl);
            request.Content = new StringContent(jsonBody, Encoding.UTF8, "application/json");
            request.Headers.Add("X-Webhook-Timestamp", timestamp);
            request.Headers.Add("X-Webhook-Id", webhookId);
            request.Headers.Add("X-Webhook-Signature", $"sha256={signature}");

            _logger.LogInformation(
                "[Webhook] Sending ReviewCreated webhook to {Url}. WebhookId: {WebhookId}, ReservationId: {ReservationId}",
                webhookUrl, webhookId, reservationId);

            var response = await _httpClient.SendAsync(request);

            if (response.IsSuccessStatusCode)
            {
                var responseContent = await response.Content.ReadAsStringAsync();
                _logger.LogInformation(
                    "[Webhook] Webhook delivered successfully ({StatusCode}). Response: {Response}",
                    response.StatusCode, responseContent);
            }
            else
            {
                _logger.LogWarning(
                    "[Webhook] Webhook delivery returned non-success code ({StatusCode}) from {Url}",
                    response.StatusCode, webhookUrl);
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(
                ex,
                "[Webhook] Failed to deliver ReviewCreated webhook to {Url}. Error: {Message}",
                webhookUrl, ex.Message);
        }
    }
}
