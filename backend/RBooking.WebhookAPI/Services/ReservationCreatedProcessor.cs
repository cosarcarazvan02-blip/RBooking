using RBooking.WebhookAPI.DTOs;

namespace RBooking.WebhookAPI.Services;

/// <summary>
/// Procesează evenimentul reservation-created: cere detaliile complete de la API A și
/// trimite un email de notificare operatorului cazării. Fără persistență proprie -
/// spre deosebire de AccommodationUpdateProcessor, nu ținem un istoric aici.
/// </summary>
public class ReservationCreatedProcessor
{
    private readonly IApiAServiceClient _apiAServiceClient;
    private readonly IEmailSender _emailSender;
    private readonly ILogger<ReservationCreatedProcessor> _logger;

    public ReservationCreatedProcessor(
        IApiAServiceClient apiAServiceClient,
        IEmailSender emailSender,
        ILogger<ReservationCreatedProcessor> logger)
    {
        _apiAServiceClient = apiAServiceClient;
        _emailSender = emailSender;
        _logger = logger;
    }

    public async Task ProcessAsync(ReservationCreatedWebhookDto payload)
    {
        ReservationNotificationDetailsDto? details;
        try
        {
            details = await _apiAServiceClient.GetReservationNotificationDetailsAsync(payload.ReservationId);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Nu s-au putut obține detaliile rezervării {ReservationId} de la API A.", payload.ReservationId);
            return;
        }

        if (details == null)
        {
            _logger.LogWarning("Rezervarea {ReservationId} nu a fost găsită la API A.", payload.ReservationId);
            return;
        }

        if (string.IsNullOrWhiteSpace(details.OperatorEmail))
        {
            _logger.LogWarning("Cazarea \"{AccommodationName}\" (rezervare {ReservationId}) nu are un operator identificabil - emailul nu a fost trimis.", details.AccommodationName, payload.ReservationId);
            return;
        }

        await _emailSender.SendAsync(
            details.OperatorEmail,
            $"Rezervare nouă la \"{details.AccommodationName}\"",
            BuildEmailBody(details));
    }

    private static string BuildEmailBody(ReservationNotificationDetailsDto d)
    {
        var nights = Math.Max(1, (d.CheckOutDate.Date - d.CheckInDate.Date).Days);
        var commissionPercent = (d.PlatformFeeRate * 100).ToString("0.##");

        return $"Bună, {d.OperatorFirstName},\n\n" +
               $"Ai primit o rezervare nouă la \"{d.AccommodationName}\", făcută pe {d.ReservationCreatedAt:dd.MM.yyyy}.\n\n" +
               $"Oaspete: {d.GuestName} ({d.GuestEmail})\n" +
               $"Perioadă: {d.CheckInDate:dd.MM.yyyy} – {d.CheckOutDate:dd.MM.yyyy} ({nights} nopți, {d.NumberOfGuests} oaspeți)\n\n" +
               $"Total plătit de oaspete: {d.TotalPrice:0.00} RON\n" +
               $"Comision RBooking ({commissionPercent}%): -{d.PlatformFeeAmount:0.00} RON\n" +
               $"Suma ta: {d.OperatorPayoutAmount:0.00} RON\n\n" +
               "Echipa RBooking.";
    }
}
