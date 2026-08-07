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
    [HttpPost("accommodations")]
    [AllowAnonymous]
    public async Task<IActionResult> GenerateAccommodationReport([FromBody] AccommodationReportRequestDto request)
    {
        var (content, contentType, fileName) = await _accommodationReportService.GenerateReportAsync(request);
        return File(content, contentType, fileName);
    }
}
