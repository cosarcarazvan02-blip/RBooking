using Microsoft.EntityFrameworkCore;
using RBooking.Application.Interfaces;
using RBooking.Domain.Entities;
using RBooking.Infrastructure.Data;

namespace RBooking.Infrastructure.Repositories;

public class ServiceClientRepository : IServiceClientRepository
{
    private readonly AppDbContext _context;

    public ServiceClientRepository(AppDbContext context)
    {
        _context = context;
    }

    public async Task<ServiceClient> AddAsync(ServiceClient serviceClient)
    {
        _context.ServiceClients.Add(serviceClient);
        await _context.SaveChangesAsync();
        return serviceClient;
    }

    public async Task<ServiceClient?> GetByClientIdAsync(string clientId)
    {
        return await _context.ServiceClients.FirstOrDefaultAsync(sc => sc.ClientId == clientId);
    }
}
