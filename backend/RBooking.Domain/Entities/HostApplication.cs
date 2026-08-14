using RBooking.Domain.Enums;

namespace RBooking.Domain.Entities;

public class HostApplication
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid UserId { get; set; }
    public User? User { get; set; }
    public HostApplicationStatus Status { get; set; } = HostApplicationStatus.Pending;
    public string? Message { get; set; }
    public DateTime SubmittedAt { get; set; } = DateTime.UtcNow;
    public Guid? ReviewedByUserId { get; set; }
    public DateTime? ReviewedAt { get; set; }
    public string? RejectionReason { get; set; }
}
