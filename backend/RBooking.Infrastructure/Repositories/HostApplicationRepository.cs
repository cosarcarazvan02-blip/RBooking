using Microsoft.EntityFrameworkCore;
using RBooking.Application.Interfaces;
using RBooking.Domain.Entities;
using RBooking.Domain.Enums;
using RBooking.Infrastructure.Data;

namespace RBooking.Infrastructure.Repositories;

public class HostApplicationRepository : IHostApplicationRepository
{
    private readonly AppDbContext _context;

    public HostApplicationRepository(AppDbContext context)
    {
        _context = context;
    }

    public async Task<HostApplication?> GetByIdAsync(Guid id)
    {
        return await _context.HostApplications
            .Include(a => a.User)
            .FirstOrDefaultAsync(a => a.Id == id);
    }

    public async Task<IEnumerable<HostApplication>> GetByStatusAsync(HostApplicationStatus? status)
    {
        var query = _context.HostApplications
            .Include(a => a.User)
            .AsQueryable();

        if (status.HasValue)
        {
            query = query.Where(a => a.Status == status.Value);
        }

        return await query
            .OrderByDescending(a => a.SubmittedAt)
            .ToListAsync();
    }

    public async Task<HostApplication?> GetPendingByUserIdAsync(Guid userId)
    {
        return await _context.HostApplications
            .Where(a => a.UserId == userId && a.Status == HostApplicationStatus.Pending)
            .FirstOrDefaultAsync();
    }

    public async Task<HostApplication?> GetLatestByUserIdAsync(Guid userId)
    {
        return await _context.HostApplications
            .Where(a => a.UserId == userId)
            .OrderByDescending(a => a.SubmittedAt)
            .FirstOrDefaultAsync();
    }

    public async Task<HostApplication> AddAsync(HostApplication application)
    {
        await _context.HostApplications.AddAsync(application);
        await _context.SaveChangesAsync();
        return application;
    }

    public async Task<HostApplication?> UpdateAsync(HostApplication application)
    {
        _context.HostApplications.Update(application);
        await _context.SaveChangesAsync();
        return application;
    }
}
