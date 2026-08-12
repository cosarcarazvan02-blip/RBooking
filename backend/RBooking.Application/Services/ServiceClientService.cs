using System.Security.Cryptography;
using System.Text;
using RBooking.Application.DTOs;
using RBooking.Application.Interfaces;
using RBooking.Domain.Entities;

namespace RBooking.Application.Services;

public class ServiceClientService : IServiceClientService
{
    private readonly IServiceClientRepository _serviceClientRepository;
    private readonly IJwtTokenGenerator _jwtTokenGenerator;

    public ServiceClientService(
        IServiceClientRepository serviceClientRepository,
        IJwtTokenGenerator jwtTokenGenerator)
    {
        _serviceClientRepository = serviceClientRepository;
        _jwtTokenGenerator = jwtTokenGenerator;
    }

    public async Task<ServiceClientDto> GenerateClientAsync(string clientName)
    {
        var clientId = $"client_{Guid.NewGuid():N}";
        var rawSecretBytes = new byte[32];
        RandomNumberGenerator.Fill(rawSecretBytes);
        var clientSecret = Convert.ToHexString(rawSecretBytes).ToLowerInvariant();

        var client = new ServiceClient
        {
            Id = Guid.NewGuid(),
            ClientId = clientId,
            ClientSecretHash = HashSecret(clientSecret),
            ClientName = string.IsNullOrWhiteSpace(clientName) ? "External Service" : clientName.Trim(),
            Role = "Service",
            IsActive = true,
            CreatedAt = DateTime.UtcNow
        };

        var created = await _serviceClientRepository.AddAsync(client);

        return new ServiceClientDto
        {
            Id = created.Id,
            ClientId = created.ClientId,
            // Secretul în clar există doar aici, la generare - nu se persistă niciodată, doar hash-ul lui.
            ClientSecret = clientSecret,
            ClientName = created.ClientName,
            Role = created.Role,
            IsActive = created.IsActive,
            CreatedAt = created.CreatedAt
        };
    }

    public async Task<ServiceClientTokenResponseDto?> AuthenticateClientAsync(string clientId, string clientSecret)
    {
        if (string.IsNullOrWhiteSpace(clientId) || string.IsNullOrWhiteSpace(clientSecret))
        {
            return null;
        }

        var client = await _serviceClientRepository.GetByClientIdAsync(clientId.Trim());
        if (client == null || !client.IsActive)
        {
            return null;
        }

        var expectedHashBytes = Convert.FromHexString(client.ClientSecretHash);
        var suppliedHashBytes = Convert.FromHexString(HashSecret(clientSecret.Trim()));

        if (expectedHashBytes.Length != suppliedHashBytes.Length ||
            !CryptographicOperations.FixedTimeEquals(expectedHashBytes, suppliedHashBytes))
        {
            return null;
        }

        var token = _jwtTokenGenerator.GenerateServiceToken(client);

        return new ServiceClientTokenResponseDto
        {
            AccessToken = token,
            TokenType = "Bearer",
            ExpiresIn = 7200,
            ClientId = client.ClientId
        };
    }

    public async Task<IEnumerable<ServiceClientDto>> GetAllClientsAsync()
    {
        var clients = await _serviceClientRepository.GetAllAsync();
        return clients.Select(c => new ServiceClientDto
        {
            Id = c.Id,
            ClientId = c.ClientId,
            ClientSecret = "[PROTECTED]",
            ClientName = c.ClientName,
            Role = c.Role,
            IsActive = c.IsActive,
            CreatedAt = c.CreatedAt
        });
    }

    private static string HashSecret(string secret)
    {
        var hashBytes = SHA256.HashData(Encoding.UTF8.GetBytes(secret));
        return Convert.ToHexString(hashBytes).ToLowerInvariant();
    }
}
