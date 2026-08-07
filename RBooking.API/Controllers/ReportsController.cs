using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using RBooking.Application.DTOs;
using RBooking.Application.Interfaces;

namespace RBooking.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ReportsController : ControllerBase
{
    private readonly IAccommodationReportService _accommodationReportService;

    public ReportsController(IAccommodationReportService accommodationReportService)
    {
        _accommodationReportService = accommodationReportService;
    }

    /// <summary>
    /// Generates a CSV, XLSX, or PDF report for accommodations with column selection and multi-column filtering.
    /// </summary>
    [HttpGet("accommodations")]
    [AllowAnonymous]
    public async Task<IActionResult> GenerateAccommodationReport(
        [FromQuery] string format = "csv",
        [FromQuery] List<string>? columns = null,
        [FromQuery] AccommodationReportFilterDto? filter = null)
    {
        var resolvedColumns = new List<string>();
        if (columns != null && columns.Any())
        {
            foreach (var col in columns)
            {
                if (!string.IsNullOrWhiteSpace(col))
                {
                    var parts = col.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);
                    resolvedColumns.AddRange(parts);
                }
            }
        }

        var request = new AccommodationReportRequestDto
        {
            Format = format,
            Columns = resolvedColumns.Any() ? resolvedColumns : null,
            Filters = filter
        };

        var (content, contentType, fileName) = await _accommodationReportService.GenerateReportAsync(request);
        return File(content, contentType, fileName);
    }
}
