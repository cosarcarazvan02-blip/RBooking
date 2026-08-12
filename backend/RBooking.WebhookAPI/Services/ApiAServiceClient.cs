using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using RBooking.WebhookAPI.DTOs;

namespace RBooking.WebhookAPI.Services;

/// <summary>
/// Talks back to API A on behalf of API B, authenticating via client_id/client_secret
/// (client-credentials style) against /api/service-auth/token and caching the resulting
/// ServiceBearer JWT until shortly before it expires.
/// </summary>
public class ApiAServiceClient : IApiAServiceClient
{
    private readonly HttpClient _httpClient;
    private readonly IConfiguration _configuration;
    private readonly ILogger<ApiAServiceClient> _logger;

    private string? _cachedToken;
    private DateTimeOffset _cachedTokenExpiresAt = DateTimeOffset.MinValue;
    private readonly SemaphoreSlim _tokenLock = new(1, 1);

    public ApiAServiceClient(HttpClient httpClient, IConfiguration configuration, ILogger<ApiAServiceClient> logger)
    {
        _httpClient = httpClient;
        _configuration = configuration;
        _logger = logger;
    }

    public async Task<PagedResultDto<ReservationDto>> GetFutureReservationsPageAsync(Guid accommodationId, int pageNumber, int pageSize)
    {
        var token = await GetValidTokenAsync();
        var response = await SendWithAuthAsync(token, accommodationId, pageNumber, pageSize);

        if (response.StatusCode == HttpStatusCode.Unauthorized)
        {
            // Token may have just expired or been rejected - force a fresh login and retry once.
            token = await GetValidTokenAsync(forceRefresh: true);
            response = await SendWithAuthAsync(token, accommodationId, pageNumber, pageSize);
        }

        response.EnsureSuccessStatusCode();
        var result = await response.Content.ReadFromJsonAsync<PagedResultDto<ReservationDto>>();
        return result ?? new PagedResultDto<ReservationDto>();
    }

    private Task<HttpResponseMessage> SendWithAuthAsync(string token, Guid accommodationId, int pageNumber, int pageSize)
    {
        var request = new HttpRequestMessage(
            HttpMethod.Get,
            $"/api/reservations/by-accommodation/{accommodationId}/future?pageNumber={pageNumber}&pageSize={pageSize}");
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", token);
        AddApiKeyHeader(request);
        return _httpClient.SendAsync(request);
    }

    private void AddApiKeyHeader(HttpRequestMessage request)
    {
        var apiKey = _configuration["ApiA:ApiKey"];
        if (!string.IsNullOrWhiteSpace(apiKey))
        {
            request.Headers.Add("X-Api-Key", apiKey);
        }
    }

    private async Task<string> GetValidTokenAsync(bool forceRefresh = false)
    {
        await _tokenLock.WaitAsync();
        try
        {
            if (!forceRefresh && _cachedToken != null && DateTimeOffset.UtcNow < _cachedTokenExpiresAt)
            {
                return _cachedToken;
            }

            var clientId = _configuration["ApiA:ClientId"]
                ?? throw new InvalidOperationException("ApiA:ClientId nu este configurat.");
            var clientSecret = _configuration["ApiA:ClientSecret"]
                ?? throw new InvalidOperationException("ApiA:ClientSecret nu este configurat.");

            var tokenRequest = new HttpRequestMessage(HttpMethod.Post, "/api/auth/client-token")
            {
                Content = JsonContent.Create(new { clientId, clientSecret })
            };
            AddApiKeyHeader(tokenRequest);

            var response = await _httpClient.SendAsync(tokenRequest);
            response.EnsureSuccessStatusCode();

            var tokenResponse = await response.Content.ReadFromJsonAsync<ServiceTokenResponseDto>()
                ?? throw new InvalidOperationException("Răspuns invalid de la /api/service-auth/token.");

            _cachedToken = tokenResponse.AccessToken;
            // Refresh a bit early to avoid racing the token's actual expiry.
            _cachedTokenExpiresAt = DateTimeOffset.UtcNow.AddSeconds(Math.Max(0, tokenResponse.ExpiresIn - 30));

            _logger.LogInformation("Token ServiceBearer nou obținut de la API A, expiră în {ExpiresIn}s.", tokenResponse.ExpiresIn);
            return _cachedToken;
        }
        finally
        {
            _tokenLock.Release();
        }
    }
}
