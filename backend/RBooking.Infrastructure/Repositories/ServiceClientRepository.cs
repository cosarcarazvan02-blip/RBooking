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

    public async Task<ServiceClient?> GetByClientIdAsync(string clientId)
    {
        return await _context.ServiceClients
            .FirstOrDefaultAsync(c => c.ClientId == clientId);
    }

    public async Task<IEnumerable<ServiceClient>> GetAllAsync()
    {
        return await _context.ServiceClients
            .OrderByDescending(c => c.CreatedAt)
            .ToListAsync();
    }

    public async Task<ServiceClient> AddAsync(ServiceClient client)
    {
        await _context.ServiceClients.AddAsync(client);
        await _context.SaveChangesAsync();
        return client;
    }
}
