using System.Security.Cryptography;
using System.Text;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using RBooking.Application.DTOs;
using RBooking.Application.Interfaces;

namespace RBooking.API.Controllers;

/// <summary>
/// Issues short-lived ServiceBearer JWTs to other services (e.g. API B) that
/// authenticate with a client_id + client_secret pair provisioned via /api/service-clients.
/// </summary>
[ApiController]
[Route("api/service-auth")]
[AllowAnonymous]
public class ServiceAuthController : ControllerBase
{
    private const int ExpiresInSeconds = 30 * 60;

    private readonly IServiceClientRepository _serviceClientRepository;
    private readonly IJwtTokenGenerator _jwtTokenGenerator;

    public ServiceAuthController(IServiceClientRepository serviceClientRepository, IJwtTokenGenerator jwtTokenGenerator)
    {
        _serviceClientRepository = serviceClientRepository;
        _jwtTokenGenerator = jwtTokenGenerator;
    }

    [HttpPost("token")]
    public async Task<ActionResult<ServiceTokenResponseDto>> GetToken([FromBody] ServiceTokenRequestDto request)
    {
        if (string.IsNullOrWhiteSpace(request?.ClientId) || string.IsNullOrWhiteSpace(request.ClientSecret))
        {
            return BadRequest(new { message = "client_id și client_secret sunt obligatorii." });
        }

        var serviceClient = await _serviceClientRepository.GetByClientIdAsync(request.ClientId.Trim());
        if (serviceClient == null || !SecretMatches(request.ClientSecret, serviceClient.ClientSecretHash))
        {
            return Unauthorized(new { message = "client_id sau client_secret invalide." });
        }

        var token = _jwtTokenGenerator.GenerateServiceToken(serviceClient.ClientId);

        return Ok(new ServiceTokenResponseDto
        {
            AccessToken = token,
            TokenType = "Bearer",
            ExpiresIn = ExpiresInSeconds
        });
    }

    private static bool SecretMatches(string suppliedSecret, string expectedHashHex)
    {
        var suppliedHash = SHA256.HashData(Encoding.UTF8.GetBytes(suppliedSecret));
        var expectedHash = Convert.FromHexString(expectedHashHex);
        return CryptographicOperations.FixedTimeEquals(suppliedHash, expectedHash);
    }
}
