using RBooking.Domain.Entities;
using RBooking.Domain.Enums;

namespace RBooking.Application.Interfaces;

public interface IHostApplicationRepository
{
    Task<HostApplication?> GetByIdAsync(Guid id);
    Task<IEnumerable<HostApplication>> GetByStatusAsync(HostApplicationStatus? status);
    Task<HostApplication?> GetPendingByUserIdAsync(Guid userId);
    Task<HostApplication?> GetLatestByUserIdAsync(Guid userId);
    Task<HostApplication> AddAsync(HostApplication application);
    Task<HostApplication?> UpdateAsync(HostApplication application);
}
