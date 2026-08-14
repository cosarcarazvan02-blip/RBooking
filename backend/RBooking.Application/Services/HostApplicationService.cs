using RBooking.Application.DTOs;
using RBooking.Application.Interfaces;
using RBooking.Domain.Entities;
using RBooking.Domain.Enums;

namespace RBooking.Application.Services;

public class HostApplicationService : IHostApplicationService
{
    private readonly IHostApplicationRepository _hostApplicationRepository;
    private readonly IUserRepository _userRepository;

    public HostApplicationService(
        IHostApplicationRepository hostApplicationRepository,
        IUserRepository userRepository)
    {
        _hostApplicationRepository = hostApplicationRepository;
        _userRepository = userRepository;
    }

    public async Task<HostApplicationDto> SubmitApplicationAsync(Guid currentUserId, CreateHostApplicationDto dto)
    {
        var user = await _userRepository.GetByIdAsync(currentUserId);
        if (user == null)
        {
            throw new ArgumentException($"User with ID {currentUserId} was not found.");
        }

        if (user.Role == UserRole.Operator)
        {
            throw new InvalidOperationException("Ești deja operator.");
        }

        var existingPending = await _hostApplicationRepository.GetPendingByUserIdAsync(currentUserId);
        if (existingPending != null)
        {
            throw new InvalidOperationException("Ai deja o cerere în așteptare.");
        }

        var application = new HostApplication
        {
            UserId = currentUserId,
            User = user,
            Message = dto.Message,
            Status = HostApplicationStatus.Pending,
            SubmittedAt = DateTime.UtcNow
        };

        var created = await _hostApplicationRepository.AddAsync(application);
        return MapToDto(created);
    }

    public async Task<HostApplicationDto?> GetMyLatestApplicationAsync(Guid currentUserId)
    {
        var application = await _hostApplicationRepository.GetLatestByUserIdAsync(currentUserId);
        return application == null ? null : MapToDto(application);
    }

    public async Task<IEnumerable<HostApplicationDto>> GetApplicationsAsync(UserRole currentUserRole, HostApplicationStatus? status)
    {
        if (currentUserRole != UserRole.Admin)
        {
            throw new UnauthorizedAccessException("Doar administratorii pot vedea cererile de host.");
        }

        var applications = await _hostApplicationRepository.GetByStatusAsync(status);
        return applications.Select(MapToDto);
    }

    public async Task<HostApplicationDto> ApproveAsync(Guid applicationId, Guid currentUserId, UserRole currentUserRole)
    {
        if (currentUserRole != UserRole.Admin)
        {
            throw new UnauthorizedAccessException("Doar administratorii pot aproba cereri de host.");
        }

        var application = await _hostApplicationRepository.GetByIdAsync(applicationId);
        if (application == null)
        {
            throw new ArgumentException($"HostApplication with ID {applicationId} was not found.");
        }

        if (application.Status != HostApplicationStatus.Pending)
        {
            throw new InvalidOperationException("Cererea a fost deja revizuită.");
        }

        application.Status = HostApplicationStatus.Approved;
        application.ReviewedByUserId = currentUserId;
        application.ReviewedAt = DateTime.UtcNow;
        var updated = await _hostApplicationRepository.UpdateAsync(application);

        var applicant = application.User ?? await _userRepository.GetByIdAsync(application.UserId);
        if (applicant != null && applicant.Role != UserRole.Operator)
        {
            applicant.Role = UserRole.Operator;
            await _userRepository.UpdateAsync(applicant);
        }

        return MapToDto(updated!);
    }

    public async Task<HostApplicationDto> RejectAsync(Guid applicationId, Guid currentUserId, UserRole currentUserRole, string reason)
    {
        if (currentUserRole != UserRole.Admin)
        {
            throw new UnauthorizedAccessException("Doar administratorii pot respinge cereri de host.");
        }

        if (string.IsNullOrWhiteSpace(reason))
        {
            throw new ArgumentException("Motivul respingerii este obligatoriu.");
        }

        var application = await _hostApplicationRepository.GetByIdAsync(applicationId);
        if (application == null)
        {
            throw new ArgumentException($"HostApplication with ID {applicationId} was not found.");
        }

        if (application.Status != HostApplicationStatus.Pending)
        {
            throw new InvalidOperationException("Cererea a fost deja revizuită.");
        }

        application.Status = HostApplicationStatus.Rejected;
        application.ReviewedByUserId = currentUserId;
        application.ReviewedAt = DateTime.UtcNow;
        application.RejectionReason = reason;
        var updated = await _hostApplicationRepository.UpdateAsync(application);

        return MapToDto(updated!);
    }

    private static HostApplicationDto MapToDto(HostApplication application)
    {
        return new HostApplicationDto
        {
            Id = application.Id,
            UserId = application.UserId,
            UserFirstName = application.User?.FirstName ?? string.Empty,
            UserLastName = application.User?.LastName ?? string.Empty,
            UserEmail = application.User?.Email ?? string.Empty,
            Status = application.Status,
            Message = application.Message,
            SubmittedAt = application.SubmittedAt,
            ReviewedByUserId = application.ReviewedByUserId,
            ReviewedAt = application.ReviewedAt,
            RejectionReason = application.RejectionReason
        };
    }
}
