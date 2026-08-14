namespace RBooking.Application.Interfaces;

public interface IEmailSender
{
    /// <summary>
    /// Implementations must never throw - a failed email must not fail the request that triggered it.
    /// </summary>
    Task SendAsync(string toEmail, string subject, string body);
}
