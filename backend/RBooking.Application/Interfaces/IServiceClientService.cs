using RBooking.Application.DTOs;

namespace RBooking.Application.Interfaces;

public interface IServiceClientService
{
    Task<ServiceClientDto> GenerateClientAsync(string clientName);
    Task<ServiceClientTokenResponseDto?> AuthenticateClientAsync(string clientId, string clientSecret);
    Task<IEnumerable<ServiceClientDto>> GetAllClientsAsync();
}
