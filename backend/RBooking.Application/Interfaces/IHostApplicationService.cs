using RBooking.Application.DTOs;
using RBooking.Domain.Enums;

namespace RBooking.Application.Interfaces;

public interface IHostApplicationService
{
    Task<HostApplicationDto> SubmitApplicationAsync(Guid currentUserId, CreateHostApplicationDto dto);
    Task<HostApplicationDto?> GetMyLatestApplicationAsync(Guid currentUserId);
    Task<IEnumerable<HostApplicationDto>> GetApplicationsAsync(UserRole currentUserRole, HostApplicationStatus? status);
    Task<HostApplicationDto> ApproveAsync(Guid applicationId, Guid currentUserId, UserRole currentUserRole);
    Task<HostApplicationDto> RejectAsync(Guid applicationId, Guid currentUserId, UserRole currentUserRole, string reason);
}
