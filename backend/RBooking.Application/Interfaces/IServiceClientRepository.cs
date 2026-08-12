using RBooking.Domain.Entities;

namespace RBooking.Application.Interfaces;

public interface IServiceClientRepository
{
    Task<ServiceClient> AddAsync(ServiceClient serviceClient);
    Task<ServiceClient?> GetByClientIdAsync(string clientId);
}
