using ClosedXML.Excel;
using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;
using RBooking.Application.DTOs;
using RBooking.Application.Interfaces;
using RBooking.Domain.Entities;
using System.Globalization;
using System.Text;

namespace RBooking.Application.Services;

public class ReservationService : IReservationService
{
    private readonly IReservationRepository _reservationRepository;

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

    public async Task<ReservationImportResultDto> ImportReservationsFromCsvAsync(Stream fileStream)
    {
        var result = new ReservationImportResultDto();
        var errors = new Dictionary<int, List<string>>();
        var validReservationsToInsert = new List<Reservation>();

        using var textReader = new StreamReader(fileStream, Encoding.UTF8);
        string? headerLine = await textReader.ReadLineAsync();
        if (headerLine == null) return result;

        int lineNumber = 1;
        string? line;
        while ((line = await textReader.ReadLineAsync()) != null)
        {
            lineNumber++;
            if (string.IsNullOrWhiteSpace(line)) continue;

            var values = line.Split(',');
            var rowErrors = new List<string>();

            if (values.Length < 6)
            {
                rowErrors.Add("număr insuficient de coloane");
                errors.Add(lineNumber, rowErrors);
                continue;
            }

            string rawUserId = values[0].Trim().Trim('"');
            string rawAccommodationId = values[1].Trim().Trim('"');
            string rawCheckInDate = values[2].Trim().Trim('"');
            string rawGuests = values[3].Trim().Trim('"');
            string rawPrice = values[4].Trim().Trim('"');
            string rawStatus = values[5].Trim().Trim('"');

            if (!Guid.TryParse(rawUserId, out Guid userId))
            {
                rowErrors.Add("UserId invalid (nu este un GUID corect)");
            }

            if (!Guid.TryParse(rawAccommodationId, out Guid accommodationId))
            {
                rowErrors.Add("AccommodationId invalid (nu este un GUID corect)");
            }

            if (!DateTime.TryParse(rawCheckInDate, CultureInfo.InvariantCulture, DateTimeStyles.None, out DateTime checkInDate))
            {
                rowErrors.Add("CheckInDate are format invalid (format acceptat: YYYY-MM-DD)");
            }
            else if (checkInDate.Date < DateTime.UtcNow.Date)
            {
                rowErrors.Add("CheckInDate nu poate fi în trecut");
            }

            if (!int.TryParse(rawGuests, out int numberOfGuests) || numberOfGuests <= 0)
            {
                rowErrors.Add("NumberOfGuests trebuie să fie un număr întreg mai mare ca 0");
            }

            if (!decimal.TryParse(rawPrice, NumberStyles.Any, CultureInfo.InvariantCulture, out decimal totalPrice) || totalPrice < 0)
            {
                rowErrors.Add("TotalPrice trebuie să fie o valoare numerică validă și pozitivă");
            }

            if (!Enum.TryParse<Domain.Enums.ReservationStatus>(rawStatus, true, out var status))
            {
                rowErrors.Add("Status invalid");
            }

            if (rowErrors.Count > 0)
            {
                errors.Add(lineNumber, rowErrors);
                continue;
            }

            var allExisting = await _reservationRepository.GetAllAsync();
            bool existsInDb = allExisting.Any(r => r.UserId == userId && r.AccommodationId == accommodationId && r.CheckInDate.Date == checkInDate.Date);
            bool existsInBatch = validReservationsToInsert.Any(r => r.UserId == userId && r.AccommodationId == accommodationId && r.CheckInDate.Date == checkInDate.Date);

            if (existsInDb || existsInBatch)
            {
                rowErrors.Add("există deja o rezervare identică pentru acest utilizator, cazare și dată (duplicat)");
                errors.Add(lineNumber, rowErrors);
                continue;
            }

            validReservationsToInsert.Add(new Reservation
            {
                Id = Guid.NewGuid(),
                UserId = userId,
                AccommodationId = accommodationId,
                CheckInDate = DateTime.SpecifyKind(checkInDate, DateTimeKind.Utc),
                NumberOfGuests = numberOfGuests,
                TotalPrice = totalPrice,
                Status = status,
                CreatedAt = DateTime.UtcNow
            });
        }

        foreach (var reservation in validReservationsToInsert)
        {
            await _reservationRepository.AddAsync(reservation);
        }

        result.SuccessfulCount = validReservationsToInsert.Count;
        result.FailedCount = errors.Count;
        result.Errors = errors;

        return result;
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

        var parsedColumns = request.Columns;
        if (parsedColumns != null && parsedColumns.Count == 1 && parsedColumns[0].Contains(','))
        {
            parsedColumns = parsedColumns[0].Split(',', StringSplitOptions.RemoveEmptyEntries).Select(c => c.Trim()).ToList();
        }

        var defaultColumns = new List<string> { "Id", "UserEmail", "AccommodationName", "CheckInDate", "TotalPrice", "Status" };
        var selectedColumns = (parsedColumns == null || parsedColumns.Count == 0)
            ? defaultColumns
            : parsedColumns.Select(c => c.Trim()).Where(c => c.Length > 0).ToList();

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

    private object? GetPropertyValue(Reservation r, string propertyName)
    {
        return propertyName.ToLowerInvariant() switch
        {
            "id" => r.Id,
            "username" => r.User != null ? $"{r.User.FirstName} {r.User.LastName}" : string.Empty,
            "useremail" => r.User?.Email ?? string.Empty,
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