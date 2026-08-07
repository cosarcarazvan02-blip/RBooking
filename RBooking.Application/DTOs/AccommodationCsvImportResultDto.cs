using System.Text.Json.Serialization;

namespace RBooking.Application.DTOs;

public class AccommodationCsvImportResultDto
{
    [JsonPropertyName("successfulInsertCount")]
    public int SuccessfulInsertCount { get; set; }

    [JsonPropertyName("failedInsertCount")]
    public int FailedInsertCount { get; set; }

    [JsonPropertyName("failedInsertsDetails")]
    public List<FailedInsertItemDto> FailedInsertsDetails { get; set; } = new();

    /// <summary>
    /// Lista de linii cu erori formatate ca: "linia 1: problema 1, problema 2"
    /// </summary>
    [JsonPropertyName("failedInserts")]
    public List<string> FailedInserts => FailedInsertsDetails.Select(f => f.FormattedMessage).ToList();
}
