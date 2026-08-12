using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using RBooking.ApiB.DTOs;

namespace RBooking.ApiB.Services;

public class ApiAClient : IApiAClient
{
    private readonly HttpClient _httpClient;
    private readonly IConfiguration _configuration;
    private readonly ILogger<ApiAClient> _logger;

    private string? _cachedToken;
    private DateTime _tokenExpiry = DateTime.MinValue;
    private readonly SemaphoreSlim _tokenLock = new(1, 1);

    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNameCaseInsensitive = true
    };

    public ApiAClient(
        HttpClient httpClient,
        IConfiguration configuration,
        ILogger<ApiAClient> logger)
    {
        _httpClient = httpClient;
        _configuration = configuration;
        _logger = logger;
    }

    private string BaseUrl => _configuration["ApiA:BaseUrl"] ?? "http://localhost:5293";
    private string ClientId => _configuration["ApiA:ClientId"] ?? "api-b-service-client";
    private string ClientSecret => _configuration["ApiA:ClientSecret"] ?? "API_B_Super_Secret_Client_Key_2026_x9k2M!";
    private string ApiKey => _configuration["ApiA:ApiKey"] ?? "RBooking_Secret_ApiKey_2026_x9k2M!";

    public async Task<string> GetServiceTokenAsync()
    {
        if (!string.IsNullOrEmpty(_cachedToken) && DateTime.UtcNow < _tokenExpiry.AddMinutes(-5))
        {
            return _cachedToken;
        }

        await _tokenLock.WaitAsync();
        try
        {
            if (!string.IsNullOrEmpty(_cachedToken) && DateTime.UtcNow < _tokenExpiry.AddMinutes(-5))
            {
                return _cachedToken;
            }

            var tokenUrl = $"{BaseUrl.TrimEnd('/')}/api/auth/client-token";
            var requestBody = new
            {
                clientId = ClientId,
                clientSecret = ClientSecret
            };

            var request = new HttpRequestMessage(HttpMethod.Post, tokenUrl)
            {
                Content = new StringContent(JsonSerializer.Serialize(requestBody), Encoding.UTF8, "application/json")
            };
            request.Headers.Add("X-Api-Key", ApiKey);

            _logger.LogInformation("[ApiAClient] Requesting ServiceBearer token from {Url} with ClientId: {ClientId}", tokenUrl, ClientId);

            var response = await _httpClient.SendAsync(request);
            if (!response.IsSuccessStatusCode)
            {
                var errorContent = await response.Content.ReadAsStringAsync();
                _logger.LogError("[ApiAClient] Failed to obtain token from API A ({StatusCode}): {Error}", response.StatusCode, errorContent);
                throw new InvalidOperationException($"Failed to obtain ServiceBearer token from API A: {response.StatusCode} - {errorContent}");
            }

            var content = await response.Content.ReadAsStringAsync();
            var tokenResponse = JsonSerializer.Deserialize<ApiATokenResponseDto>(content, JsonOptions);

            if (tokenResponse == null || string.IsNullOrWhiteSpace(tokenResponse.AccessToken))
            {
                throw new InvalidOperationException("Received empty token from API A client-token endpoint.");
            }

            _cachedToken = tokenResponse.AccessToken;
            var expiresInSeconds = tokenResponse.ExpiresIn > 0 ? tokenResponse.ExpiresIn : 7200;
            _tokenExpiry = DateTime.UtcNow.AddSeconds(expiresInSeconds);

            _logger.LogInformation("[ApiAClient] Successfully acquired and cached ServiceBearer token. Expires at: {Expiry}", _tokenExpiry);
            return _cachedToken;
        }
        finally
        {
            _tokenLock.Release();
        }
    }

    public async Task<ApiAReservationDto?> GetReservationByIdAsync(Guid reservationId)
    {
        var token = await GetServiceTokenAsync();
        var url = $"{BaseUrl.TrimEnd('/')}/api/reservations/{reservationId}";

        using var request = new HttpRequestMessage(HttpMethod.Get, url);
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", token);
        request.Headers.Add("X-Api-Key", ApiKey);

        _logger.LogInformation("[ApiAClient] Fetching reservation {ReservationId} from {Url}", reservationId, url);

        var response = await _httpClient.SendAsync(request);
        if (!response.IsSuccessStatusCode)
        {
            var err = await response.Content.ReadAsStringAsync();
            _logger.LogWarning("[ApiAClient] Could not fetch reservation {ReservationId} ({StatusCode}): {Error}", reservationId, response.StatusCode, err);
            return null;
        }

        var content = await response.Content.ReadAsStringAsync();
        return JsonSerializer.Deserialize<ApiAReservationDto>(content, JsonOptions);
    }

    public async Task<PagedApiAResultDto<ApiAReservationDto>?> GetReservationsByAccommodationPagedAsync(
        Guid accommodationId,
        int pageNumber,
        int pageSize)
    {
        var token = await GetServiceTokenAsync();
        var url = $"{BaseUrl.TrimEnd('/')}/api/reservations/accommodation/{accommodationId}?pageNumber={pageNumber}&pageSize={pageSize}";

        using var request = new HttpRequestMessage(HttpMethod.Get, url);
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", token);
        request.Headers.Add("X-Api-Key", ApiKey);

        _logger.LogInformation("[ApiAClient] Fetching batch of reservations for Accommodation {AccommodationId} (Page: {Page}, Size: {Size})", accommodationId, pageNumber, pageSize);

        var response = await _httpClient.SendAsync(request);
        if (!response.IsSuccessStatusCode)
        {
            var err = await response.Content.ReadAsStringAsync();
            _logger.LogWarning("[ApiAClient] Error fetching paged reservations for Accommodation {AccommodationId} ({StatusCode}): {Error}", accommodationId, response.StatusCode, err);
            return null;
        }

        var content = await response.Content.ReadAsStringAsync();
        return JsonSerializer.Deserialize<PagedApiAResultDto<ApiAReservationDto>>(content, JsonOptions);
    }
}
