using ClosedXML.Excel;
using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;
using RBooking.Application.DTOs;
using RBooking.Application.Interfaces;
using RBooking.Domain.Entities;
using System.Text;

namespace RBooking.Application.Services;

public class ReservationService : IReservationService
{
    private readonly IReservationRepository _reservationRepository;

    // FIX: lista coloanelor valide, intr-un singur loc, folosita atat pentru matching
    // cat si pentru validare. Evita sa avem "magic strings" duplicate in mai multe locuri.
    private static readonly HashSet<string> AllowedColumns = new(StringComparer.OrdinalIgnoreCase)
    {
        "Id", "UserName", "UserEmail", "AccommodationName", "City", "Country",
        "CheckInDate", "NumberOfGuests", "TotalPrice", "Status"
    };

    public ReservationService(IReservationRepository reservationRepository)
    {
        _reservationRepository = reservationRepository;
        QuestPDF.Settings.License = LicenseType.Community;
    }

    public async Task<PagedResultDto<ReservationDto>> GetPagedReservationsAsync(PaginationParamsDto paginationParams)
    {
        throw new NotImplementedException();
    }

    public async Task<IEnumerable<ReservationDto>> GetAllReservationsAsync()
    {
        throw new NotImplementedException();
    }

    public async Task<ReservationDto?> GetReservationByIdAsync(Guid id)
    {
        throw new NotImplementedException();
    }

    public async Task<PagedResultDto<ReservationDto>> GetPagedReservationsByUserIdAsync(Guid userId, PaginationParamsDto paginationParams)
    {
        throw new NotImplementedException();
    }

    public async Task<ReservationDto> CreateReservationAsync(CreateReservationDto createReservationDto)
    {
        throw new NotImplementedException();
    }

    public async Task<ReservationDto?> UpdateReservationStatusAsync(Guid id, Domain.Enums.ReservationStatus status)
    {
        throw new NotImplementedException();
    }

    public async Task<bool> DeleteReservationAsync(Guid id, Guid currentUserId, Domain.Enums.UserRole currentUserRole)
    {
        throw new NotImplementedException();
    }

    public async Task<bool> CancelReservationAsync(Guid id)
    {
        throw new NotImplementedException();
    }

    public async Task<(byte[] FileContent, string ContentType, string FileName)> GenerateReportAsync(ReservationReportRequestDto request)
    {
        var allReservations = await _reservationRepository.GetAllAsync();
        var query = allReservations.AsQueryable();

        var filters = request.Filters;

        if (!string.IsNullOrEmpty(filters.UserName))
            query = query.Where(r => (r.User != null && (r.User.FirstName + " " + r.User.LastName).Contains(filters.UserName, StringComparison.OrdinalIgnoreCase)));

        if (!string.IsNullOrEmpty(filters.UserEmail))
            query = query.Where(r => r.User != null && r.User.Email.Contains(filters.UserEmail, StringComparison.OrdinalIgnoreCase));

        if (!string.IsNullOrEmpty(filters.AccommodationName))
            query = query.Where(r => r.Accommodation != null && r.Accommodation.Name.Contains(filters.AccommodationName, StringComparison.OrdinalIgnoreCase));

        if (!string.IsNullOrEmpty(filters.City))
            query = query.Where(r => r.Accommodation != null && r.Accommodation.City.Contains(filters.City, StringComparison.OrdinalIgnoreCase));

        if (!string.IsNullOrEmpty(filters.Country))
            query = query.Where(r => r.Accommodation != null && r.Accommodation.Country.Contains(filters.Country, StringComparison.OrdinalIgnoreCase));

        if (filters.CheckInDateFrom.HasValue)
            query = query.Where(r => r.CheckInDate >= filters.CheckInDateFrom.Value);

        if (filters.CheckInDateTo.HasValue)
            query = query.Where(r => r.CheckInDate <= filters.CheckInDateTo.Value);

        if (filters.NumberOfGuests.HasValue)
            query = query.Where(r => r.NumberOfGuests == filters.NumberOfGuests.Value);

        if (filters.MinPrice.HasValue)
            query = query.Where(r => r.TotalPrice >= filters.MinPrice.Value);

        if (filters.MaxPrice.HasValue)
            query = query.Where(r => r.TotalPrice <= filters.MaxPrice.Value);

        if (!string.IsNullOrEmpty(filters.Status))
            query = query.Where(r => r.Status.ToString() == filters.Status);

        var reservations = query.ToList();

        // Gestionăm corect cazul în care coloanele vin ca un singur string despărțit prin virgulă din query
        var parsedColumns = request.Columns;
        if (parsedColumns != null && parsedColumns.Count == 1 && parsedColumns[0].Contains(','))
        {
            parsedColumns = parsedColumns[0].Split(',', StringSplitOptions.RemoveEmptyEntries).Select(c => c.Trim()).ToList();
        }

        var defaultColumns = new List<string> { "Id", "UserEmail", "AccommodationName", "CheckInDate", "TotalPrice", "Status" };
        // FIX: Trim() pe fiecare nume de coloana primit - un spatiu din greseala la tastare
        // in Swagger nu mai duce la coloana goala silentios.
        var selectedColumns = (parsedColumns == null || parsedColumns.Count == 0)
            ? defaultColumns
            : parsedColumns.Select(c => c.Trim()).Where(c => c.Length > 0).ToList();

        // FIX: validam coloanele cerute fata de lista permisa (case-insensitive).
        // Daca cineva scrie gresit numele unei coloane, primeste eroare clara acum,
        // nu un raport cu coloana goala fara explicatie.
        var unknownColumns = selectedColumns.Where(c => !AllowedColumns.Contains(c)).ToList();
        if (unknownColumns.Count > 0)
        {
            throw new ArgumentException($"Coloane necunoscute: {string.Join(", ", unknownColumns)}. Coloane valide: {string.Join(", ", AllowedColumns)}.");
        }

        string format = request.Format?.ToLower() ?? "csv";

        return format switch
        {
            "xlsx" => GenerateExcel(reservations, selectedColumns),
            "pdf" => GeneratePdf(reservations, selectedColumns),
            _ => GenerateCsv(reservations, selectedColumns)
        };
    }

    private (byte[] FileContent, string ContentType, string FileName) GenerateCsv(List<Reservation> data, List<string> columns)
    {
        var sb = new StringBuilder();
        sb.AppendLine(string.Join(",", columns));

        foreach (var r in data)
        {
            var values = columns.Select(col => GetPropertyValue(r, col)?.ToString() ?? "").Select(v => $"\"{v}\"");
            sb.AppendLine(string.Join(",", values));
        }

        var bytes = Encoding.UTF8.GetBytes(sb.ToString());
        return (bytes, "text/csv", $"reservations_report_{DateTime.UtcNow:yyyyMMdd}.csv");
    }

    private (byte[] FileContent, string ContentType, string FileName) GenerateExcel(List<Reservation> data, List<string> columns)
    {
        using var workbook = new XLWorkbook();
        var worksheet = workbook.Worksheets.Add("Reservations Report");

        for (int i = 0; i < columns.Count; i++)
        {
            worksheet.Cell(1, i + 1).Value = columns[i];
            worksheet.Cell(1, i + 1).Style.Font.Bold = true;
        }

        int row = 2;
        foreach (var r in data)
        {
            for (int i = 0; i < columns.Count; i++)
            {
                var val = GetPropertyValue(r, columns[i]);
                worksheet.Cell(row, i + 1).Value = val?.ToString() ?? "";
            }
            row++;
        }

        worksheet.Columns().AdjustToContents();

        using var stream = new MemoryStream();
        workbook.SaveAs(stream);
        return (stream.ToArray(), "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", $"reservations_report_{DateTime.UtcNow:yyyyMMdd}.xlsx");
    }

    private (byte[] FileContent, string ContentType, string FileName) GeneratePdf(List<Reservation> data, List<string> columns)
    {
        var document = Document.Create(container =>
        {
            container.Page(page =>
            {
                page.Size(PageSizes.A4.Landscape());
                page.Margin(20);
                page.Header().Text("Reservation Report").SemiBold().FontSize(20).FontColor(Colors.Blue.Medium);

                page.Content().PaddingVertical(10).Table(table =>
                {
                    table.ColumnsDefinition(c =>
                    {
                        foreach (var _ in columns)
                            c.RelativeColumn();
                    });

                    table.Header(header =>
                    {
                        foreach (var col in columns)
                        {
                            header.Cell().Background(Colors.Grey.Lighten2).Padding(5).Text(col).Bold();
                        }
                    });

                    foreach (var r in data)
                    {
                        foreach (var col in columns)
                        {
                            var val = GetPropertyValue(r, col)?.ToString() ?? "";
                            table.Cell().BorderBottom(1).BorderColor(Colors.Grey.Lighten3).Padding(5).Text(val);
                        }
                    }
                });

                page.Footer().AlignCenter().Text(x =>
                {
                    x.CurrentPageNumber();
                    x.Span(" / ");
                    x.TotalPages();
                });
            });
        });

        var pdfBytes = document.GeneratePdf();
        return (pdfBytes, "application/pdf", $"reservations_report_{DateTime.UtcNow:yyyyMMdd}.pdf");
    }

    // FIX: matching case-insensitive pe numele coloanei, in loc de switch exact-match
    // pe string. "userEmail", "USEREMAIL", " Id " (cu spatii, dupa Trim mai sus) merg acum la fel.
    private object? GetPropertyValue(Reservation r, string propertyName)
    {
        return propertyName.ToLowerInvariant() switch
        {
            "id" => r.Id,
            "username" => r.User != null ? $"{r.User.FirstName} {r.User.LastName}" : string.Empty,
            "useremail" => r.User?.Email ?? string.Empty, // Folosește string gol dacă user e null
            "accommodationname" => r.Accommodation?.Name ?? string.Empty,
            "city" => r.Accommodation?.City ?? string.Empty,
            "country" => r.Accommodation?.Country ?? string.Empty,
            "checkindate" => r.CheckInDate.ToString("yyyy-MM-dd"),
            "numberofguests" => r.NumberOfGuests,
            "totalprice" => r.TotalPrice,
            "status" => r.Status.ToString(),
            _ => null
        };
    }

    public Task<IEnumerable<ReservationDto>> GetReservationsByUserIdAsync(Guid userId)
    {
        throw new NotImplementedException();
    }
}