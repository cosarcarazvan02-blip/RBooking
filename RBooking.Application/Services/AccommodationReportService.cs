using System.Text;
using ClosedXML.Excel;
using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;
using RBooking.Application.DTOs;
using RBooking.Application.Interfaces;

namespace RBooking.Application.Services;

public class AccommodationReportService : IAccommodationReportService
{
    private readonly IAccommodationRepository _accommodationRepository;

    private static readonly List<string> AllSupportedColumns = new()
    {
        "Id",
        "Name",
        "Description",
        "Location",
        "City",
        "Country",
        "PricePerNight",
        "OperatorId",
        "AccommodationType",
        "AverageRating",
        "TotalReviewsCount",
        "Stars",
        "HasPool",
        "HasRoomService",
        "TotalRooms",
        "FloorNumber",
        "HasElevator",
        "NumberOfRooms",
        "IsFurnished",
        "BedInSharedRoomPrice",
        "HasSharedKitchen",
        "TotalBeds"
    };

    public AccommodationReportService(IAccommodationRepository accommodationRepository)
    {
        _accommodationRepository = accommodationRepository;
    }

    public async Task<(byte[] Content, string ContentType, string FileName)> GenerateReportAsync(AccommodationReportRequestDto request)
    {
        var data = (await _accommodationRepository.GetReportDataAsync(request.Filters)).ToList();

        // Resolve requested columns (preserving valid casing and order)
        var selectedColumns = ResolveColumns(request.Columns);

        var format = request.Format?.Trim().ToLowerInvariant() ?? "csv";

        return format switch
        {
            "xlsx" or "excel" => (
                GenerateXlsx(data, selectedColumns),
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                $"accommodations_report_{DateTime.UtcNow:yyyyMMdd_HHmmss}.xlsx"
            ),
            "pdf" => (
                GeneratePdf(data, selectedColumns, request.Filters),
                "application/pdf",
                $"accommodations_report_{DateTime.UtcNow:yyyyMMdd_HHmmss}.pdf"
            ),
            _ => (
                GenerateCsv(data, selectedColumns),
                "text/csv",
                $"accommodations_report_{DateTime.UtcNow:yyyyMMdd_HHmmss}.csv"
            )
        };
    }

    private static List<string> ResolveColumns(List<string>? requestedColumns)
    {
        if (requestedColumns == null || !requestedColumns.Any())
        {
            return new List<string>(AllSupportedColumns);
        }

        var result = new List<string>();
        foreach (var col in requestedColumns)
        {
            var matched = AllSupportedColumns.FirstOrDefault(c => c.Equals(col.Trim(), StringComparison.OrdinalIgnoreCase));
            if (matched != null && !result.Contains(matched))
            {
                result.Add(matched);
            }
        }

        return result.Any() ? result : new List<string>(AllSupportedColumns);
    }

    private static byte[] GenerateCsv(List<AccommodationDto> data, List<string> columns)
    {
        var sb = new StringBuilder();

        // Header
        sb.AppendLine(string.Join(",", columns.Select(EscapeCsv)));

        // Rows
        foreach (var item in data)
        {
            var rowValues = columns.Select(col => EscapeCsv(GetColumnValue(item, col)));
            sb.AppendLine(string.Join(",", rowValues));
        }

        return Encoding.UTF8.GetPreamble().Concat(Encoding.UTF8.GetBytes(sb.ToString())).ToArray();
    }

    private static string EscapeCsv(string? value)
    {
        if (string.IsNullOrEmpty(value)) return "";
        if (value.Contains(",") || value.Contains("\"") || value.Contains("\n") || value.Contains("\r"))
        {
            return $"\"{value.Replace("\"", "\"\"")}\"";
        }
        return value;
    }

    private static byte[] GenerateXlsx(List<AccommodationDto> data, List<string> columns)
    {
        using var workbook = new XLWorkbook();
        var worksheet = workbook.Worksheets.Add("Accommodations Report");

        // Headers
        for (int i = 0; i < columns.Count; i++)
        {
            var cell = worksheet.Cell(1, i + 1);
            cell.Value = columns[i];
            cell.Style.Font.Bold = true;
            cell.Style.Fill.BackgroundColor = XLColor.FromHtml("#4F46E5");
            cell.Style.Font.FontColor = XLColor.White;
            cell.Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Center;
        }

        // Rows
        for (int r = 0; r < data.Count; r++)
        {
            var item = data[r];
            for (int c = 0; c < columns.Count; c++)
            {
                var val = GetColumnValue(item, columns[c]);
                worksheet.Cell(r + 2, c + 1).Value = val;
            }
        }

        worksheet.Columns().AdjustToContents();

        using var ms = new MemoryStream();
        workbook.SaveAs(ms);
        return ms.ToArray();
    }

    private static byte[] GeneratePdf(List<AccommodationDto> data, List<string> columns, AccommodationReportFilterDto? filters)
    {
        QuestPDF.Settings.License = LicenseType.Community;

        var document = Document.Create(container =>
        {
            container.Page(page =>
            {
                page.Size(PageSizes.A4.Landscape());
                page.Margin(1, Unit.Centimetre);
                page.PageColor(Colors.White);
                page.DefaultTextStyle(x => x.FontSize(8).FontFamily("Helvetica"));

                page.Header().Column(col =>
                {
                    col.Item().Text("Accommodations Report")
                        .FontSize(16).Bold().FontColor(Colors.Indigo.Medium);
                    col.Item().Text($"Generated on: {DateTime.UtcNow:yyyy-MM-dd HH:mm:ss} UTC | Total results: {data.Count}")
                        .FontSize(8).FontColor(Colors.Grey.Medium);
                    col.Item().PaddingBottom(8);
                });

                page.Content().Table(table =>
                {
                    table.ColumnsDefinition(cols =>
                    {
                        foreach (var _ in columns)
                        {
                            cols.RelativeColumn();
                        }
                    });

                    table.Header(header =>
                    {
                        foreach (var colName in columns)
                        {
                            header.Cell().Background(Colors.Indigo.Medium)
                                .Padding(4)
                                .Text(colName)
                                .FontColor(Colors.White)
                                .Bold();
                        }
                    });

                    foreach (var item in data)
                    {
                        foreach (var colName in columns)
                        {
                            var val = GetColumnValue(item, colName);
                            table.Cell().BorderBottom(0.5f).BorderColor(Colors.Grey.Lighten2)
                                .Padding(4)
                                .Text(val);
                        }
                    }
                });

                page.Footer().AlignRight().Text(x =>
                {
                    x.Span("Page ");
                    x.CurrentPageNumber();
                    x.Span(" of ");
                    x.TotalPages();
                });
            });
        });

        return document.GeneratePdf();
    }

    private static string GetColumnValue(AccommodationDto a, string columnName)
    {
        return columnName.Trim().ToLowerInvariant() switch
        {
            "id" => a.Id.ToString(),
            "name" => a.Name ?? "",
            "description" => a.Description ?? "",
            "location" => a.Location ?? "",
            "city" => a.City ?? "",
            "country" => a.Country ?? "",
            "pricepernight" => a.PricePerNight.ToString("F2"),
            "operatorid" => a.OperatorId ?? "",
            "accommodationtype" => a.AccommodationType ?? "",
            "averagerating" => a.AverageRating.ToString("F1"),
            "totalreviewscount" => a.TotalReviewsCount.ToString(),
            "stars" => a.Stars?.ToString() ?? "-",
            "haspool" => a.HasPool.HasValue ? (a.HasPool.Value ? "Yes" : "No") : "-",
            "hasroomservice" => a.HasRoomService.HasValue ? (a.HasRoomService.Value ? "Yes" : "No") : "-",
            "totalrooms" => a.TotalRooms?.ToString() ?? "-",
            "floornumber" => a.FloorNumber?.ToString() ?? "-",
            "haselevator" => a.HasElevator.HasValue ? (a.HasElevator.Value ? "Yes" : "No") : "-",
            "numberofrooms" => a.NumberOfRooms?.ToString() ?? "-",
            "isfurnished" => a.IsFurnished.HasValue ? (a.IsFurnished.Value ? "Yes" : "No") : "-",
            "bedinsharedroomprice" => a.BedInSharedRoomPrice?.ToString("F2") ?? "-",
            "hassharedkitchen" => a.HasSharedKitchen.HasValue ? (a.HasSharedKitchen.Value ? "Yes" : "No") : "-",
            "totalbeds" => a.TotalBeds?.ToString() ?? "-",
            _ => ""
        };
    }
}
