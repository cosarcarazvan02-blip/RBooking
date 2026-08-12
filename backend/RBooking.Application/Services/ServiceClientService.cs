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
            ClientSecret = clientSecret,
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
            ClientSecret = created.ClientSecret,
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

        var expectedSecretBytes = Encoding.UTF8.GetBytes(client.ClientSecret);
        var suppliedSecretBytes = Encoding.UTF8.GetBytes(clientSecret.Trim());

        if (expectedSecretBytes.Length != suppliedSecretBytes.Length ||
            !CryptographicOperations.FixedTimeEquals(expectedSecretBytes, suppliedSecretBytes))
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
}
