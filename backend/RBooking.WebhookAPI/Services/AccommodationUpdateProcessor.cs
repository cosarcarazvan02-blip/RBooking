using System.Text.Json;
using RBooking.WebhookAPI.Data;
using RBooking.WebhookAPI.DTOs;
using RBooking.WebhookAPI.Entities;

namespace RBooking.WebhookAPI.Services;

/// <summary>
/// Handles an accommodation-updated webhook end to end: persists the change log row,
/// then pages through API A's future-reservations endpoint (never loading them all at
/// once) emailing every affected user about only the fields that changed.
/// </summary>
public class AccommodationUpdateProcessor
{
    private const int PageSize = 25;

    private readonly WebhookDbContext _dbContext;
    private readonly IApiAServiceClient _apiAServiceClient;
    private readonly IEmailSender _emailSender;
    private readonly ILogger<AccommodationUpdateProcessor> _logger;

    public AccommodationUpdateProcessor(
        WebhookDbContext dbContext,
        IApiAServiceClient apiAServiceClient,
        IEmailSender emailSender,
        ILogger<AccommodationUpdateProcessor> logger)
    {
        _dbContext = dbContext;
        _apiAServiceClient = apiAServiceClient;
        _emailSender = emailSender;
        _logger = logger;
    }

    public async Task ProcessAsync(AccommodationUpdatedWebhookDto payload)
    {
        var changeLog = new AccommodationChangeLog
        {
            AccommodationId = payload.AccommodationId,
            ModifiedByUserId = payload.ModifiedByUserId,
            ChangedAt = payload.ModifiedAt,
            OldValuesJson = JsonSerializer.Serialize(payload.OldValues),
            NewValuesJson = JsonSerializer.Serialize(payload.NewValues)
        };
        _dbContext.AccommodationChangeLogs.Add(changeLog);
        await _dbContext.SaveChangesAsync();

        var changedFieldsText = BuildChangedFieldsText(payload.OldValues, payload.NewValues);
        if (changedFieldsText.Count == 0)
        {
            return;
        }

        var pageNumber = 1;
        while (true)
        {
            PagedResultDto<ReservationDto> page;
            try
            {
                page = await _apiAServiceClient.GetFutureReservationsPageAsync(payload.AccommodationId, pageNumber, PageSize);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Nu s-au putut obține rezervările viitoare pentru AccommodationId {AccommodationId} de la API A.", payload.AccommodationId);
                return;
            }

            foreach (var reservation in page.Items)
            {
                if (string.IsNullOrWhiteSpace(reservation.UserEmail))
                {
                    continue;
                }

                await _emailSender.SendAsync(
                    reservation.UserEmail,
                    $"Cazarea \"{reservation.AccommodationName}\" a fost actualizată",
                    BuildEmailBody(reservation.AccommodationName, changedFieldsText));
            }

            if (page.Items.Count < PageSize)
            {
                break;
            }

            pageNumber++;
        }
    }

    private static List<string> BuildChangedFieldsText(Dictionary<string, object?> oldValues, Dictionary<string, object?> newValues)
    {
        return oldValues.Keys
            .Select(field => $"- {field}: {FormatValue(oldValues[field])} → {FormatValue(newValues.GetValueOrDefault(field))}")
            .ToList();
    }

    private static string FormatValue(object? value) => value?.ToString() ?? "-";

    private static string BuildEmailBody(string accommodationName, List<string> changedFieldsText)
    {
        return $"Bună,\n\n" +
               $"Cazarea \"{accommodationName}\" pentru care ai o rezervare viitoare a fost actualizată. " +
               $"Au fost modificate următoarele:\n\n" +
               string.Join("\n", changedFieldsText) +
               $"\n\nEchipa RBooking.";
    }
}
