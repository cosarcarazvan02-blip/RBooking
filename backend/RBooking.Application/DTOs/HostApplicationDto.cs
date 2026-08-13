using RBooking.Domain.Enums;

namespace RBooking.Application.DTOs;

public class HostApplicationDto
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public string UserFirstName { get; set; } = string.Empty;
    public string UserLastName { get; set; } = string.Empty;
    public string UserEmail { get; set; } = string.Empty;
    public HostApplicationStatus Status { get; set; }
    public string? Message { get; set; }
    public DateTime SubmittedAt { get; set; }
    public Guid? ReviewedByUserId { get; set; }
    public DateTime? ReviewedAt { get; set; }
    public string? RejectionReason { get; set; }
}

public class CreateHostApplicationDto
{
    public string? Message { get; set; }
}

public class RejectHostApplicationDto
{
    public string Reason { get; set; } = string.Empty;
}
