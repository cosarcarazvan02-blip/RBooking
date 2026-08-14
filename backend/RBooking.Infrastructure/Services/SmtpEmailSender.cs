using System.Net;
using System.Net.Mail;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using RBooking.Application.Interfaces;

namespace RBooking.Infrastructure.Services;

public class SmtpEmailSender : IEmailSender
{
    private readonly IConfiguration _configuration;
    private readonly ILogger<SmtpEmailSender> _logger;

    public SmtpEmailSender(IConfiguration configuration, ILogger<SmtpEmailSender> logger)
    {
        _configuration = configuration;
        _logger = logger;
    }

    public async Task SendAsync(string toEmail, string subject, string body)
    {
        var host = _configuration["Smtp:Host"];
        if (string.IsNullOrWhiteSpace(host))
        {
            _logger.LogInformation("[EMAIL - Smtp:Host neconfigurat, doar logat] To: {To} | Subject: {Subject}\n{Body}", toEmail, subject, body);
            return;
        }

        var port = int.TryParse(_configuration["Smtp:Port"], out var p) ? p : 587;
        var enableSsl = !bool.TryParse(_configuration["Smtp:EnableSsl"], out var ssl) || ssl;
        var user = _configuration["Smtp:User"];
        var password = _configuration["Smtp:Password"];
        var from = _configuration["Smtp:From"] ?? user ?? "no-reply@rbooking.local";

        using var client = new SmtpClient(host, port)
        {
            EnableSsl = enableSsl
        };
        if (!string.IsNullOrWhiteSpace(user))
        {
            client.Credentials = new NetworkCredential(user, password);
        }

        using var message = new MailMessage(from, toEmail, subject, body);

        try
        {
            await client.SendMailAsync(message);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Trimiterea emailului către {To} a eșuat.", toEmail);
        }
    }
}
