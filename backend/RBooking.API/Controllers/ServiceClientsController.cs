using System.Security.Cryptography;
using System.Text;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using RBooking.Application.DTOs;
using RBooking.Application.Interfaces;
using RBooking.Domain.Entities;

namespace RBooking.API.Controllers;

/// <summary>
/// Allows Admins to provision client_id/client_secret pairs used by other services
/// (e.g. API B) to authenticate via the ServiceBearer JWT scheme.
/// </summary>
[ApiController]
[Route("api/service-clients")]
[Authorize(Roles = "Admin")]
public class ServiceClientsController : ControllerBase
{
    private readonly IServiceClientRepository _serviceClientRepository;

    public ServiceClientsController(IServiceClientRepository serviceClientRepository)
    {
        _serviceClientRepository = serviceClientRepository;
    }

    /// <summary>
    /// Generates a new client_id + client_secret pair. The secret is only ever returned
    /// here, in plaintext, at creation time - only its hash is persisted.
    /// </summary>
    [HttpPost]
    public async Task<ActionResult<ServiceClientCreatedDto>> Create([FromBody] CreateServiceClientDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.Name))
        {
            return BadRequest(new { message = "Numele clientului este obligatoriu." });
        }

        var clientId = $"sc_{Convert.ToHexString(RandomNumberGenerator.GetBytes(16)).ToLowerInvariant()}";
        var clientSecret = Convert.ToBase64String(RandomNumberGenerator.GetBytes(32));

        var serviceClient = new ServiceClient
        {
            ClientId = clientId,
            ClientSecretHash = HashSecret(clientSecret),
            Name = dto.Name.Trim(),
            CreatedAt = DateTime.UtcNow
        };

        await _serviceClientRepository.AddAsync(serviceClient);

        return Ok(new ServiceClientCreatedDto
        {
            ClientId = clientId,
            ClientSecret = clientSecret,
            Name = serviceClient.Name,
            CreatedAt = serviceClient.CreatedAt
        });
    }

    internal static string HashSecret(string secret)
    {
        var hashBytes = SHA256.HashData(Encoding.UTF8.GetBytes(secret));
        return Convert.ToHexString(hashBytes);
    }
}
