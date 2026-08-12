using RBooking.Domain.Entities;

namespace RBooking.Application.Interfaces;

public interface IServiceClientRepository
{
    Task<ServiceClient?> GetByClientIdAsync(string clientId);
    Task<IEnumerable<ServiceClient>> GetAllAsync();
    Task<ServiceClient> AddAsync(ServiceClient client);
}
